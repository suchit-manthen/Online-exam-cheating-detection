from flask import Flask
from flask_cors import CORS

from routes.exam import exam_bp
from routes.proctoring import proctoring_bp
from routes.frontend_events import frontend_bp
from routes.admin import admin_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(exam_bp)
app.register_blueprint(proctoring_bp)
app.register_blueprint(frontend_bp)
app.register_blueprint(admin_bp)

if __name__ == "__main__":
    app.run(debug=True)
