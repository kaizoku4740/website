
# Math Academy by Mrs Garg

A professional tutoring website with multi-TA support, review system, and admin panel.

### Running Locally

1. **Start the Mock API Server** (port 9999):
```bash
cd /Users/abhi/lm
nohup python3 test-api.py > api.log 2>&1 &
```

2. **Start the Web Server** (port 8888):
```bash
nohup python3 -m http.server 8888 > web.log 2>&1 &
```

3. **Open in Browser**:
```
http://localhost:8888/index.html
```

### Stopping Servers
```bash
pkill -f "test-api.py"
pkill -f "http.server 8888"
```

## Time Spent

- **Day 1**: 5 hours - March 8th, 1:30 PM to 6:30 PM
  - Initial setup, homepage, genral structure
  
- **Day 2**: 2 hours - March 9th, 5:00 PM to 7:00 PM
  - Admin panel and CSS

- **Day 3**: 2 hours - March 9th, 3:30 PM to 5:30 PM
  - worked on review pages

**Total**: 9 hours

## Notes

- Reviews in local development are stored in-memory (lost on server restart)
- For production, deploy to Cloudflare Workers + KV for persistent storage
- The secret admin access (triple-click footer) works on all pages
- Admin password should be changed before deployment
- need to fix timezone for user

## Future Enhancements

- Email notifications for new reviews
- Review moderation queue
- TA availability calendar
- Online booking system so no mor sign up genius
- Photo uploads for reviews
- Star rating analytics
- Fix TA 2 need to add from template

---

## File Reference

### Core HTML Pages
- **`index.html`** - File which has homepage
- **`about.html`** - File with the About page
- **`contact.html`** - Contact form for inquiries - still needs to be done
- **`tas.html`** - Directory page displaying all tutors loaded from `tas.json`
- **`all-reviews.html`** - Combined view of all reviews from all TAs with filtering and sorting options
- **`admin-panel.html`** - Password-protected admin dashboard for managing reviews (triple-click footer to access)

### Review Pages (`/reviews/`)
- **`reviews/teacher.html`** - Review page for Ms. Garg
- **`reviews/ta1.html`** - Review page for TA #1
- **`reviews/ta3.html`** - Review page for TA #3
- **`reviews/ta4.html`** - Review page for TA #4
- **`reviews/ta5.html`** - Review page for TA #5
- **`reviews/template.html`** - Template file for creating new TA review pages

### Styling & JavaScript
- **`css/styles.css`** - Main stylesheet with design and CSS variables for theming
- **`js/main.js`** - Global JavaScript for navigation toggle, form handling, helper functions (escapeHtml, formatDate), testimonials, and secret admin access trigger

### Data & Configuration
- **`tas.json`** - JSON file containing all TA profile data (name, title, bio, subjects, experience)
- **`wrangler.toml`** - Cloudflare Wrangler configuration for deploying the Worker

### Backend Files
- **`test-api.py`** - Mock API server for local development (runs on port 9999)
  - Simulates Cloudflare Worker endpoints
  - Stores reviews in-memory
  - Handles GET/POST/DELETE requests with CORS support
  - Admin password: `password`
  
- **`src/index.js`** - Cloudflare Worker script for production deployment
  - Handles review CRUD operations
  - Uses Workers KV for persistent storage
  - Same API endpoints as test-api.py

### Assets & Logs
- **`favicon.svg`** - Site favicon (SVG format)
- **`api.log`** - Log file for the mock API server (auto-generated)
- **`web.log`** - Log file for the Python web server (auto-generated)

---

## 💻 Technologies Used

### Languages & Frameworks
- **HTML5** - Page structure and content markup
- **CSS3** - Styling, layouts, animations, and responsive design
- **JavaScript (ES6+)** - Client-side interactivity, API calls, and dynamic content
- **Python 3** - Mock API server for local development
- **JSON** - Data storage format for TA profiles and review data

### Tools & Platforms
- **Cloudflare Workers** - Serverless backend for production (JavaScript runtime)
- **Cloudflare KV** - Key-value storage for persistent review data
- **Cloudflare Pages** - Static site hosting for production deployment
- **Wrangler CLI** - Cloudflare deployment and management tool

### Architecture
- **Frontend**: Static HTML/CSS/JavaScript (no framework - vanilla JS for simplicity)
- **Backend**: Python (local) / JavaScript (production via Cloudflare Workers)
- **Database**: In-memory (local) / KV storage (production)
- **API**: RESTful endpoints with CORS support