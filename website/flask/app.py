from flask import Flask, render_template, url_for

app = Flask(__name__)

@app.route('/')
def start():
    return render_template('start.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/map-picker')
def map_picker():
    return render_template('map_picker.html')

if __name__ == '__main__':
    app.run(debug=True)
