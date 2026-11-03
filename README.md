# Subash & Manisha — Wedding Invitation Website

A luxury, bilingual Indian engagement & wedding invitation website designed for **Subash & Manisha**, uniting Tamil and Mithila traditions.

Hosted on **GitHub Pages** with the custom domain:
[https://subashxmanisha.in](https://subashxmanisha.in)

---

## 🏛️ Project Directory Structure

```text
subashXmanisha/
│
├── index.html                  # Main Landing Page (Language Selection)
├── 404.html                    # Custom GitHub Pages 404 fallback
├── CNAME                       # subashxmanisha.in
├── README.md                   # Project Documentation
│
├── english/
│   └── index.html              # Clean Route: /english/
│
├── tamil/
│   └── index.html              # Clean Route: /tamil/
│
├── hindi/
│   └── index.html              # Clean Route: /hindi/
│
├── binary/
│   └── index.html              # Clean Route: /binary/ (Programmer edition)
│
└── assets/
    ├── css/
    │   └── style.css           # Global stylesheet with responsive layout
    ├── js/
    │   └── script.js           # Interactive animations, countdown, petals, audio
    ├── images/                 # Optimized wedding artwork, logos & textures
    ├── videos/
    │   └── hero-vid.mp4        # Hero background ambient loop
    ├── audio/                  # Traditional wedding instruments & music
    └── fonts/
```

---

## 🌐 Routes & Language Selection

| Route | Language / Theme | File Location |
| :--- | :--- | :--- |
| `/` | **Landing Page** | `index.html` |
| `/english/` | **English Invitation** | `english/index.html` |
| `/tamil/` | **தமிழ் அழைப்பிதழ்** | `tamil/index.html` |
| `/hindi/` | **हिंदी विवाह निमंत्रण पत्र** | `hindi/index.html` |
| `/binary/` | **01010011 Binary Protocol** | `binary/index.html` |
| `/*` (Fallback) | **404 Not Found Page** | `404.html` |

Each language route contains:
- Interactive wax-seal envelope opener
- Romantic video background with ambient audio toggle
- Vedic verses and cultural motifs
- Live countdown to **February 10, 2027**
- "From Our Hearts" section with **falling petals reveal animation**
- "Our Story" interactive carousel
- Google Calendar and Google Maps direct action buttons
- Floating back-to-home navigation pill (`← Languages`)

---

## 🚀 GitHub Pages & Custom Domain Configuration

1. **Repository Settings**:
   - Go to **Settings** > **Pages** in the GitHub repository.
   - Set **Source** to `Deploy from a branch`.
   - Branch: `main` (or `master`), Folder: `/ (root)`.
2. **Custom Domain**:
   - Custom Domain: `subashxmanisha.in`
   - Verified by the root `CNAME` file containing `subashxmanisha.in`.
   - Enable **Enforce HTTPS**.
3. **Clean URLs**:
   - Every subfolder (`english/`, `tamil/`, `hindi/`, `binary/`) contains an `index.html`.
   - GitHub Pages serves directory paths automatically as clean URLs (`/english/`, `/tamil/`, `/hindi/`, `/binary/`).
   - All asset paths are root-relative (`/assets/...`) ensuring all stylesheets, media, scripts, and links resolve seamlessly from any route.

---

## 💍 Event Information

- **Couple**: Subash & Manisha
- **Groom's Parents**: Sivakumar & Sumathi
- **Bride's Parents**: Kamlesh Jha & Poonam Jha
- **Date**: February 10, 2027
- **Muhurtham**: 09:00 AM – 12:00 PM IST
- **Reception**: 06:00 PM – 10:00 PM IST
- **Venue**: Salem, Tamil Nadu
