"""
This module is the main module in this package. It loads emotion recognition model from a file,
shows a webcam image, recognizes face and it's emotion and draw emotion on the image.
"""


#d('/usr/lib/python3.4/site-packages')
from cv2 import *

import cv2
from socket import *
from face_detect import find_faces
from image_commons import nparray_as_image, draw_with_alpha


def _load_emoticons(emotions):
    """
    Loads emotions images from graphics folder.
    :param emotions: Array of emotions names.
    :return: Array of emotions graphics.
    """
    return [nparray_as_image(cv2.imread('graphics/%s.png' % emotion, -1), mode=None) for emotion in emotions]


def show_webcam_and_run(model, emoticons, window_size=None, window_name='webcam', update_time=10):
    """
    Shows webcam image, detects faces and its emotions in real time and draw emoticons over those faces.
    :param model: Learnt emotion detection model.
    :param emoticons: List of emotions images.
    :param window_size: Size of webcam image window.
    :param window_name: Name of webcam image window.
    :param update_time: Image update time interval.
    """
    cv2.namedWindow(window_name, WINDOW_NORMAL)
    if window_size:
        width, height = window_size
        cv2.resizeWindow(window_name, width, height)
          
    vc = cv2.VideoCapture(0)
    if vc.isOpened():
        read_value, webcam_image = vc.read()
    else:
        print("webcam not found")
        return
    preprediction = 0
    count = 0
    image_to_draw = emoticons[0]
    while read_value:
        for normalized_face, (x, y, w, h) in find_faces(webcam_image):
            prediction = model.predict(normalized_face)  # do prediction
            if cv2.__version__ != '3.1.0':
                prediction = prediction[0]

            if preprediction == prediction:
                count = count +1
            #    image_to_draw = emoticons[0]
            else:
                image_to_draw = emoticons[0]
                count = 0

            if count == 3:
                image_to_draw = emoticons[prediction]
                count =0

            cv2.rectangle(webcam_image, (x,y), (x+w,y+h), (0, 255, 0), 3)
            draw_with_alpha(webcam_image, image_to_draw, (0, 0, 100, 100))
            preprediction = prediction
            print(prediction)
            if prediction == 0:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=0 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
            if prediction == 1:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=1 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
            if prediction == 2:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=2 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
            if prediction == 3:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=3 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
            if prediction == 4:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=4 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
            if prediction == 5:
              s = socket(AF_INET, SOCK_STREAM)
              s.connect(('localhost', 9090))
              s.send('GET /emotion.do?id=5 HTTP/1.1\r\n')
              s.send('Host : localhost\r\n')
              s.send('\r\n')
              s.close()
        cv2.imshow(window_name, webcam_image)
        read_value, webcam_image = vc.read()
        key = cv2.waitKey(update_time)

        if key == 27:  # exit on ESC
            break

    cv2.destroyWindow(window_name)


if __name__ == '__main__':
    emotions = ['neutral', 'anger', 'disgust', 'happy', 'sadness', 'surprise']
    emoticons = _load_emoticons(emotions)

    # load model
    if cv2.__version__ == '3.1.0':
        fisher_face = cv2.face.createFisherFaceRecognizer()
    else:
        fisher_face = cv2.createFisherFaceRecognizer()
    fisher_face.load('models/emotion_detection_model.xml')
    # use learnt model
    window_name = 'WEBCAM (press ESC to exit)'
    show_webcam_and_run(fisher_face, emoticons, window_size=(1600, 1200), window_name=window_name, update_time=8)
