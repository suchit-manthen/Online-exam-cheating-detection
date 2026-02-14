import warnings
warnings.simplefilter("ignore", FutureWarning)

from flask import Flask
from flask_cors import CORS

from routes.exam import exam_bp
from routes.proctoring import proctoring_bp
from routes.frontend_events import frontend_bp
from routes.admin import admin_bp
from routes.face_auth import bp as face_auth_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(exam_bp)
app.register_blueprint(proctoring_bp)
app.register_blueprint(frontend_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(face_auth_bp)

if __name__ == "__main__":
    app.run(debug=True)
