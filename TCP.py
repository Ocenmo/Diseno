from flask import Flask, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        try:
            data = request.get_json()
            if data is None:
                data = request.data.decode('utf-8')  # Recibir datos en otro formato
            return {"received_data": data}, 200
        except Exception as e:
            return {"error": str(e)}, 400
    return "¡Hola, mundo!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4665, debug=True)
