from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os


app = Flask(__name__)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)

# Define the Event model
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    date = db.Column(db.String(10), nullable=False)  # Store date as string (YYYY-MM-DD)
    tags = db.Column(db.String(100), nullable=True)
    link = db.Column(db.String(200), nullable=True)

    def __repr__(self):
        return f'<Event {self.title}>'

# Create the database and tables
with app.app_context():
    db.create_all()

# Route to create a new event
@app.route('/events', methods=['POST'])
def create_event():
    data = request.json
    new_event = Event(
        title=data['title'],
        description=data.get('description'),
        date=data['date'],
        tags=data.get('tags'),
        link=data.get('link')
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event created successfully!'}), 201

# Route to get all events
@app.route('/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify([{'id': event.id, 'title': event.title, 'date': event.date} for event in events])

# Run the application
if __name__ == '__main__':
    app.run(debug=True)
