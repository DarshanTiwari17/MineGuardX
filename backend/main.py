from ultralytics import YOLO
import cv2
import math
from collections import defaultdict

# Load YOLO pose model
model = YOLO("yolo26n-pose.pt")

# Camera
cap = cv2.VideoCapture(0)

# Track posture history for each detected person
posture_history = defaultdict(list)

# How many consecutive frames are required
CONFIRM_FRAMES = 5


def calculate_posture(kp):
    """
    kp = 17 x 2 array containing YOLO pose keypoints
    """

    # Required keypoints
    left_shoulder = kp[5]
    right_shoulder = kp[6]

    left_hip = kp[11]
    right_hip = kp[12]

    left_ankle = kp[15]
    right_ankle = kp[16]

    # Center points
    shoulder_x = (left_shoulder[0] + right_shoulder[0]) / 2
    shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2

    hip_x = (left_hip[0] + right_hip[0]) / 2
    hip_y = (left_hip[1] + right_hip[1]) / 2

    ankle_x = (left_ankle[0] + right_ankle[0]) / 2
    ankle_y = (left_ankle[1] + right_ankle[1]) / 2

    # ------------------------------------------------
    # 1. Calculate torso angle
    # ------------------------------------------------

    dx = hip_x - shoulder_x
    dy = hip_y - shoulder_y

    angle = abs(math.degrees(math.atan2(dx, dy)))

    # ------------------------------------------------
    # 2. Calculate body width and height
    # ------------------------------------------------

    xs = [
        left_shoulder[0],
        right_shoulder[0],
        left_hip[0],
        right_hip[0],
        left_ankle[0],
        right_ankle[0]
    ]

    ys = [
        left_shoulder[1],
        right_shoulder[1],
        left_hip[1],
        right_hip[1],
        left_ankle[1],
        right_ankle[1]
    ]

    body_width = max(xs) - min(xs)
    body_height = max(ys) - min(ys)

    # Prevent division by zero
    if body_height < 1:
        body_height = 1

    aspect_ratio = body_width / body_height

    # ------------------------------------------------
    # 3. Determine posture
    # ------------------------------------------------

    # Mostly horizontal body
    if angle > 55 or aspect_ratio > 1.5:
        posture = "FALL"

    else:
        posture = "STANDING"

    return posture, angle, aspect_ratio


while True:

    ret, frame = cap.read()

    if not ret:
        break

    results = model(frame)

    # Draw YOLO pose
    annotated_frame = results[0].plot()

    # Get keypoints
    if results[0].keypoints is not None:

        keypoints = results[0].keypoints.xy.cpu().numpy()

        for person_id, kp in enumerate(keypoints):

            # Need enough keypoints
            if len(kp) < 17:
                continue

            posture, angle, ratio = calculate_posture(kp)

            # -----------------------------------------
            # Temporal confirmation
            # -----------------------------------------

            history = posture_history[person_id]

            history.append(posture)

            if len(history) > CONFIRM_FRAMES:
                history.pop(0)

            # Count FALL frames
            fall_count = history.count("FALL")

            # Confirm only after several frames
            if fall_count >= CONFIRM_FRAMES:
                final_posture = "FALL"
            else:
                final_posture = "STANDING"

            # -----------------------------------------
            # Display result
            # -----------------------------------------

            # Use hip position for text
            center_x = int((kp[11][0] + kp[12][0]) / 2)
            center_y = int((kp[11][1] + kp[12][1]) / 2)

            cv2.putText(
                annotated_frame,
                f"Person {person_id + 1}: {final_posture}",
                (center_x, center_y - 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0) if final_posture == "STANDING" else (0, 0, 255),
                2
            )

            print(
                f"Person {person_id + 1} | "
                f"Posture: {final_posture} | "
                f"Angle: {angle:.1f} | "
                f"Ratio: {ratio:.2f}"
            )

    # Show camera
    cv2.imshow(
        "MineGuard - Person Fall Detection",
        annotated_frame
    )

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()