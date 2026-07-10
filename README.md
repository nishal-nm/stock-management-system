# Product Inventory & Stock Management System

A full-stack web application designed for comprehensive product management, variant tracking, and dynamic stock reporting.

## 🚀 Tech Stack
- **Backend**: Python (Django 4.x), Django REST Framework, PostgreSQL
- **Frontend**: React.js 18+ (Vite), Tailwind CSS, Redux Toolkit, Recharts
- **Bonus Features Implemented**: JWT Authentication, Category Management, Versatile Image Management, Low Stock Alerts, Analytics Dashboard

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:
- **Python**: 3.10+
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: v14+

---

## 🛠️ Step-by-Step Local Setup

### 1. Database Configuration
Make sure your PostgreSQL instance is running.
Create a new database named `inventory_db` using your preferred DB client (e.g., pgAdmin) or via terminal:
```bash
psql -U postgres -c "CREATE DATABASE inventory_db"
```

### 2. Environment Variables
Copy the `.env.example` file located in the root directory and rename it to `.env`. Fill in your actual database credentials.
```bash
cp .env.example .env
```
*(A `.env` file should ideally be placed in the `backend` directory or configured to be loaded from the root).*

---

### 3. Backend Setup (Django)

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

**Create and activate a virtual environment:**
- On Windows:
  ```bash
  python -m venv venv
  .\venv\Scripts\activate
  ```
- On macOS/Linux:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

**Install Dependencies:**
```bash
pip install -r requirements.txt
```
*(If the dependencies are not explicitly listed in `requirements.txt`, install manually: `pip install django djangorestframework psycopg2 djangorestframework-simplejwt django-versatileimagefield django-cors-headers python-dotenv`)*

**Run Migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Create Superuser (Admin account):**
```bash
python manage.py createsuperuser
```
*(Note: A default admin user `admin` with password `admin@123` may have already been populated via data seeding, but you can create yours to be sure).*

**Start Backend Server:**
```bash
python manage.py runserver
```
The Django API will be running on `http://localhost:8000/api/`

---

### 4. Frontend Setup (React/Vite)

Open a **new** terminal and navigate to the `frontend` folder:
```bash
cd frontend
```

**Install Node Dependencies:**
```bash
npm install
```

**Environment Setup:**
If needed, create a `.env` in the `frontend` folder containing:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Start Frontend Server:**
```bash
npm run dev
```
The React App will be accessible at `http://localhost:5173/`

---

## 📖 API Documentation & Playground
The API endpoints are fully self-documenting and interactive. Ensure your backend server is running and navigate to:
- **Swagger UI**: [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/) (To test endpoints and view input/output payload structures)
- **Redoc**: [http://localhost:8000/api/schema/redoc/](http://localhost:8000/api/schema/redoc/) (To view alternate visualizer schemas)

## 🔒 Authentication
To access the system, you must log in.
Navigate to the frontend (`http://localhost:5173`), and use your **superuser** credentials to access the Dashboard and manage inventory.

## 📝 My Approach & Architectural Decisions

Here is a quick summary of how I handled the key parts of this project, my assumptions, and design choices:

### 1. Single API Call for Product Creation (Atomic)
- **Problem**: Saving the product first and then making separate API calls for variants could fail halfway, leaving incomplete data in the database.
- **My Solution**: I set up the `POST /api/products/` endpoint to handle the product and all variants in one go. The frontend uploads the product fields (including the image file) and a JSON string of the variants in a single multipart request. The backend deserializes it in one go inside a database transaction (`@transaction.atomic`), so it's "all or nothing."

### 2. Preventing Negative Stock
- **Problem**: I need to make sure stock never drops below 0, even under concurrent sales.
- **My Solution**: I added validation at two levels:
  - **Serializer level**: Checks and blocks the sale if the quantity requested is more than what is currently in stock.
  - **Database level**: I added a `CheckConstraint(stock >= 0)` on the `SubVariant` model in PostgreSQL so it physically blocks negative values.

### 3. Cartesian Product for Variants
- **Problem**: Automatically generating sub-variant combinations when adding options (e.g., Size: S/M + Color: Red/Blue).
- **My Solution**: I wrote a clean utility function using python's `itertools.product` to calculate combinations. To keep stock levels safe, it doesn't just recreate everything: it deletes outdated combinations, leaves existing matches untouched, and adds new ones.

### 4. Soft Delete & Reuse of Product Code
- **Problem**: When a product is deleted, it needs to be soft-deleted to keep transaction history logs, but it shouldn't block adding a new product with the same code or name in the future.
- **My Solution**: When deleting, I set `is_deleted = True` and append `_del_<uuid>` to the name and code. This instantly frees up the unique constraints so the code can be reused.

### 5. Cleaning Up Frontend Components
- **Problem**: Mixing direct API fetching logic inside React pages makes code messy.
- **My Solution**: I extracted the query logic, paging, filters, and debounces into reusable hooks (`useProducts`, `useCategories`, `useStock`). This keeps the page components focused strictly on layout.

Enjoy exploring the application!
