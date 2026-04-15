from flask import Flask, request, Response, abort, send_file, send_from_directory, jsonify, render_template
import os
import mimetypes
import re
from pathlib import Path
from gtts import gTTS
import fitz
from pydub import AudioSegment


app = Flask(__name__)

# Define folders
PDF_FOLDER = Path("pdf")
TEXT_FOLDER = Path("text")
AUDIO_FOLDER = Path("audio")

# Make sure folders exist
for folder in [PDF_FOLDER, TEXT_FOLDER, AUDIO_FOLDER]:
    folder.mkdir(exist_ok=True)


@app.route("/")
def index():
    audio_files = os.listdir(AUDIO_FOLDER)
    pdf_files = os.listdir(PDF_FOLDER)
    text_files = os.listdir(TEXT_FOLDER)
    return render_template("index.html", audio_files=audio_files, pdf_files=pdf_files, text_files=text_files)

@app.route("/audio")
def getAudios():
    files = []
    for file in AUDIO_FOLDER.iterdir():
        if file.is_file():
            files.append(file.name)
    return jsonify(files)

@app.route('/stream')
def stream_audio():
    file_name = request.args.get('file')
    if not file_name:
        return abort(400, description="Missing 'file' query parameter.")

    file_path = os.path.join(AUDIO_FOLDER, file_name)

    if not os.path.isfile(file_path):
        return abort(404, description="File not found.")

    # DEFAULTNO CHUNK SIZE ODREDJUJE KLIJENT - BROWSER 
    # MOZE SE DODAT PARAMETAR KOJI CE BITI CHUNK ALI TO JE TODO
    # PAMETNI ADAPTIVE RANGE ZAHTJEVI (PO KVALITETI VEZE)

    # range daje samo dio podataka 
    range_header = request.headers.get('Range', None)
    if not range_header:
        # Ako nema Range zahtjeva, pošalji cjeli fajl
        return send_file(file_path, mimetype='audio/mpeg')

    #velicina datoteke
    size = os.path.getsize(file_path)

    # byte1 - pocetna vrijednost je 0 bajtova
    # byte2 - ovje je None jer ne znamo koji je iznos u bytovima kraj datoteke
    byte1, byte2 = 0, None

    # regex search koji trazi prema pocetnom i krajnjem baytu iz range_headera
    # \d+ 1 ili vise brojeva - \d* nula ili vise brojeva
    m = re.search(r'bytes=(\d+)-(\d*)', range_header)
    #ako je regex nasao
    if m:
        # ovo ce napraviti tuple
        g = m.groups()
        byte1 = int(g[0])
        if g[1]:
            byte2 = int(g[1])

    #koliko cemo bytova poslati kao chunk
    # KRAJ - POCETAK + 1 = UKUPNA DUZINA
    # size -1 jer su bajtovi indeksirani od nule
    # Dodajemo 1 jer su bajtovi indeksirani od nule, pa kada kazamo od 5 do 7, to su zapravo 3 bajta (5, 6, 7).
    length = (byte2 if byte2 is not None else size - 1) - byte1 + 1

    #otvori file i nadji checkpoint i procitaj duzinu
    with open(file_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)

    #206 Partial Content
    response = Response(data, 206, mimetype='audio/mpeg')
    response.headers.add('Content-Range', f'bytes {byte1}-{byte1 + length - 1}/{size}')
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('Content-Length', str(length))

    return response

@app.route("/upload_pdf", methods=["POST"])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({"error": "PDF file je obavezan."}), 400

    pdf_file = request.files['pdf']
    pdf_filename = pdf_file.filename
    pdf_path = os.path.join(PDF_FOLDER, pdf_filename)
    
    # Prvo spremi PDF (mora postojati na disku da fitz može otvoriti)
    pdf_file.save(pdf_path)

    try:
        # Extract text
        doc = fitz.open(pdf_path)
        extracted_text = ""
        for page in doc:
            extracted_text += page.get_text()
            extracted_text += "\n" + "-"*80 + "\n"

        # Generate TTS audio
        audio_filename = pdf_filename.rsplit('.', 1)[0] + ".mp3"
        success, message = generate_tts(extracted_text, audio_filename)

        if success:
            # Save text
            txt_filename = pdf_filename.rsplit('.', 1)[0] + ".txt"
            txt_path = os.path.join(TEXT_FOLDER, txt_filename)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(extracted_text)

            return jsonify({
                "message": "PDF konvertiran i audio generiran.",
                "pdf": pdf_filename,
                "text": txt_filename,
                "audio": audio_filename
            }), 200
        else:
            # Ako TTS ne uspije, briši PDF
            os.remove(pdf_path)
            os.remove(txt_filename)
            return jsonify({"error": message}), 500

    except Exception as e:
        # Ako bilo šta pukne, briši PDF
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        return jsonify({"error": str(e)}), 500

@app.route("/upload_text", methods=["POST"])
def upload_text():
    data = request.json
    if not data or "text" not in data:
        return jsonify({"error": "Polje 'text' je obavezno."}), 400

    text = data["text"]
    base_filename = data.get("filename", "output")

    # Generate TTS audio
    audio_filename = base_filename + ".mp3"
    success, message = generate_tts(text, audio_filename)

    if success:
        # Save text
        txt_filename = base_filename + ".txt"
        txt_path = os.path.join(TEXT_FOLDER, txt_filename)
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        return jsonify({"message": "Tekst konvertiran i audio generiran.", "text": txt_filename, "audio": audio_filename}), 200
    else:
        return jsonify({"error": message}), 500

@app.route('/download_pdf')
def download_pdf():
    file_name = request.args.get('file')
    if not file_name:
        return abort(400, description="Missing 'file' query parameter.")

    if not file_name.lower().endswith(".pdf"):
        return abort(400, description="Only PDF files are allowed.")

    file_path = os.path.join(PDF_FOLDER, file_name)

    if not os.path.isfile(file_path):
        return abort(404, description="File not found.")

    return send_from_directory(
        PDF_FOLDER,
        file_name,
        as_attachment=True,
        mimetype='application/pdf'
    )

def generate_tts(text, filename, lang="en"):
    mp3_path = os.path.join(AUDIO_FOLDER, filename)
    wav_path = os.path.join(AUDIO_FOLDER, filename.rsplit('.', 1)[0] + '.wav')
    try:
        tts = gTTS(text=text, lang=lang)
        tts.save(mp3_path)

        audio = AudioSegment.from_mp3(mp3_path)
        audio.export(wav_path, format="wav")

        # Ako želiš, možeš obrisati mp3 nakon konverzije
        # os.remove(mp3_path)

        return True, "OK"
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)