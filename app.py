from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# Route pour servir sitemap.xml
@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory('.', 'sitemap.xml', mimetype='application/xml')

if __name__ == "__main__":
    app.run(debug=True)
