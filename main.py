from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin
import base64
from PIL import Image
from io import BytesIO
import os
import requests

app = Flask(__name__)
app.secret_key = 'secret_key'
SAVE_DIR = 'notes'
os.makedirs(SAVE_DIR, exist_ok=True)
GEMINI_API_URL = 'https://api.gemini.com/v1/recognize'

# Configure the database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # SQLite for simplicity
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

# Create the database and tables
with app.app_context():
    db.create_all()

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/math', methods=['GET'])
def toMath():
    return "Math Page"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('userName')
        password = request.form.get('password')

        # Check user in database
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
            return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        

        # Check if user already exists
        existing = User.query.filter_by(username=username).first()
        if existing:
            flash('Username already exists','error')
            return redirect(url_for('signup'))
        
        hashed_password = generate_password_hash(password, method='sha256')

        # Add new user to database
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signin.html')

@app.route('/calendar')
@login_required
def dashboard():
    return render_template('calendar.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/save_note', methods=['POST'])
def save_note():
    data = request.get_json()
    image_data = data.get('image').split(',')[1]
    image = Image.open(BytesIO(base64.b64decode(image_data)))
    filename = os.path.join(SAVE_DIR, 'note.png')
    image.save(filename)
    return jsonify({'message': 'Note saved successfully', 'path': filename})

GEMINI_API_KEY = 'AIzaSyAReW2abEQuw4cJofeDntJ8uyLlmlgEi3A' #this WILL be removed in prod
@app.route('/recognize_math', methods=['POST'])
def recognize_math():
    data = request.get_json()
    image_data = data.get('image').split(',')[1]  # Base64 part of image
    response = requests.post(
        GEMINI_API_URL,
        headers={'Authorization': f'Bearer {GEMINI_API_KEY}'},
        json={'image': image_data}
    )
    result = response.json()
    return jsonify({'result': result.get('recognized_equation', 'No result')})


if __name__ == '__main__':
    app.run(debug=True)
