import cv2
import numpy as np
from PIL import Image, ExifTags
import imagehash
import io
import os

class ProvenanceEngine:
    def __init__(self):
        self.temp_dir = "temp_forensics"
        os.makedirs(self.temp_dir, exist_ok=True)

    def analyze_image(self, image_bytes: bytes) -> dict:
        """
        Runs a battery of forensic tests on the image.
        """
        # Load image for different libs
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        results = {
            "score": 100, # Start perfect, deduct for flaws
            "flags": [],
            "details": {}
        }

        # 1. Metadata Check
        meta_res = self._check_metadata(pil_image)
        results["details"]["metadata"] = meta_res
        if meta_res["suspicious"]:
            results["score"] -= 20
            results["flags"].append(f"Suspicious Metadata: {meta_res['software']}")

        # 2. Screen Detection (Moire/Grid)
        screen_res = self._check_screen(cv_image)
        results["details"]["screen"] = screen_res
        if screen_res["detected"]:
            results["score"] -= 40
            results["flags"].append("Potential Screen Capture (Moire Pattern)")

        # 3. Noise Analysis (AI Smoothness)
        noise_res = self._check_noise(cv_image)
        results["details"]["noise"] = noise_res
        if noise_res["is_smooth"]:
            results["score"] -= 30
            results["flags"].append("Unnatural Smoothness (Possible AI Generation)")

        # 4. ELA (Error Level Analysis)
        ela_res = self._check_ela(image_bytes)
        results["details"]["ela"] = ela_res
        if ela_res["manipulated"]:
            results["score"] -= 30
            results["flags"].append("High Error Level (Potential Manipulation)")

        # 5. Geo Analysis
        geo_res = self.analyze_geo(pil_image)
        results["details"]["geo"] = geo_res
        if not geo_res["has_gps"]:
            results["flags"].append("Missing GPS Data (Common in AI/Edited images)")
            # Don't deduct score heavily, just flag, as many real photos strip metadata.

        # Cap score
        results["score"] = max(0, results["score"])
        
        return results

    def _check_metadata(self, image: Image.Image) -> dict:
        """
        Checks Exif data for editing software signatures.
        """
        suspicious_software = ["Photoshop", "GIMP", "Midjourney", "DALL-E", "Stable Diffusion"]
        found_software = "Unknown"
        is_suspicious = False

        try:
            exif = image._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    if tag == "Software":
                        found_software = str(value)
                        for soft in suspicious_software:
                            if soft.lower() in found_software.lower():
                                is_suspicious = True
                                break
        except Exception:
            pass

        return {"software": found_software, "suspicious": is_suspicious}

    def _check_screen(self, image: np.ndarray) -> dict:
        """
        Uses FFT to detect periodic patterns (grids) common in photos of screens.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift))
        
        # Simple heuristic: Check for high energy peaks away from center (DC component)
        # In a real implementation, we'd look for specific geometric patterns.
        # For MVP: Calculate mean magnitude. Screen photos often have higher high-freq energy.
        mean_mag = np.mean(magnitude_spectrum)
        
        # Threshold needs tuning. Let's say > 160 is suspicious for now.
        detected = mean_mag > 160 
        
        return {"mean_magnitude": float(mean_mag), "detected": detected}

    def _check_noise(self, image: np.ndarray) -> dict:
        """
        Analyzes local variance. AI images often have very low, uniform noise.
        Real camera sensors have higher, random noise.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Estimate noise sigma
        h, w = gray.shape
        # Use a Laplacian to highlight edges/noise
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = np.var(laplacian)
        
        # AI images often have lower variance in smooth areas (but high in detailed).
        # This is a simplified check. 
        # Low variance < 100 might indicate synthetic smoothness.
        is_smooth = variance < 100
        
        return {"variance": float(variance), "is_smooth": is_smooth}

    def _check_ela(self, original_bytes: bytes) -> dict:
        """
        Performs Error Level Analysis.
        Saves image at 95% quality and subtracts from original.
        High difference indicates the pixels were not originally compressed at that level (manipulation).
        """
        try:
            # 1. Save as 95% JPEG
            pil_image = Image.open(io.BytesIO(original_bytes)).convert("RGB")
            temp_path = os.path.join(self.temp_dir, "ela_temp.jpg")
            pil_image.save(temp_path, "JPEG", quality=95)
            
            # 2. Load both
            resaved_image = Image.open(temp_path)
            
            # 3. Calculate Difference
            ela_image = Image.new("RGB", pil_image.size)
            
            # Pixel-wise difference
            # (In production use numpy for speed, loop for clarity here)
            orig_data = pil_image.load()
            resaved_data = resaved_image.load()
            ela_data = ela_image.load()
            
            width, height = pil_image.size
            max_diff = 0
            total_diff = 0
            
            # Optimization: Use numpy for diff
            np_orig = np.array(pil_image).astype(np.int16)
            np_resaved = np.array(resaved_image).astype(np.int16)
            
            diff = np.abs(np_orig - np_resaved)
            
            # Scale up difference for visibility (ELA visualization)
            # scale = 10
            # np_ela = np.clip(diff * scale, 0, 255).astype(np.uint8)
            
            max_diff = np.max(diff)
            mean_diff = np.mean(diff)
            
            # Heuristic: If mean difference is very high, it might be a re-save of a re-save (or highly edited)
            # If specific regions are high, it's spliced. 
            # For global score:
            manipulated = mean_diff > 15 # Arbitrary threshold for MVP
            
            return {"max_diff": float(max_diff), "mean_diff": float(mean_diff), "manipulated": manipulated}
            
        except Exception as e:
            return {"error": str(e), "manipulated": False}

    def analyze_liveness(self, image_bytes: bytes, challenge_number: int) -> dict:
        """
        Liveness Check: Counts fingers to verify if the user is showing the correct number.
        Uses MediaPipe Hands.
        """
        import mediapipe as mp
        
        mp_hands = mp.solutions.hands
        hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        finger_count = 0
        detected = False
        
        if results.multi_hand_landmarks:
            detected = True
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Simple logic for finger counting (assuming hand is open/upright)
            # Thumb
            if hand_landmarks.landmark[4].x < hand_landmarks.landmark[3].x:
                finger_count += 1
            # Index
            if hand_landmarks.landmark[8].y < hand_landmarks.landmark[6].y:
                finger_count += 1
            # Middle
            if hand_landmarks.landmark[12].y < hand_landmarks.landmark[10].y:
                finger_count += 1
            # Ring
            if hand_landmarks.landmark[16].y < hand_landmarks.landmark[14].y:
                finger_count += 1
            # Pinky
            if hand_landmarks.landmark[20].y < hand_landmarks.landmark[18].y:
                finger_count += 1
                
        hands.close()
        
        passed = (finger_count == challenge_number)
        
        return {
            "detected": detected,
            "finger_count": finger_count,
            "challenge": challenge_number,
            "passed": passed
        }

    def analyze_geo(self, image: Image.Image) -> dict:
        """
        Extracts GPS data from Exif and reverse geocodes it.
        """
        from geopy.geocoders import Nominatim
        
        gps_info = {}
        try:
            exif = image._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    if tag == "GPSInfo":
                        gps_info = value
                        break
        except:
            pass
            
        if not gps_info:
            return {"has_gps": False, "location": "Unknown"}
            
        # Helper to convert DMS to Decimal
        def dms_to_decimal(dms, ref):
            degrees = dms[0]
            minutes = dms[1]
            seconds = dms[2]
            decimal = degrees + minutes / 60.0 + seconds / 3600.0
            if ref in ['S', 'W']:
                decimal = -decimal
            return decimal

        try:
            lat = dms_to_decimal(gps_info[2], gps_info[1])
            lon = dms_to_decimal(gps_info[4], gps_info[3])
            
            geolocator = Nominatim(user_agent="layers_verisnap")
            location = geolocator.reverse(f"{lat}, {lon}")
            
            return {
                "has_gps": True,
                "lat": lat,
                "lon": lon,
                "address": location.address if location else "Unknown"
            }
        except Exception as e:
             return {"has_gps": True, "location": f"Error parsing GPS: {str(e)}"}
