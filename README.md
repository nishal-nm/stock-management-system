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

## 🧠 Architectural Design & Problem-Solving Approach

We chose a design that emphasizes database integrity, atomic execution, and robust user experience. Below are the key engineering decisions, assumptions, and edge cases we resolved:

### 1. Atomic Transactions & Payload Consolidation
* **Approach**: To prevent partial database saves (e.g., when a product details save succeeds but variant creations fail), we consolidated product creation and variant option declarations into a single, cohesive request payload (`POST /api/products/`).
* **Implementation**: The backend parses stringified nested parameters during `multipart/form-data` uploads (allowing image uploads and complex variant schemas in one go) and wraps the entire routine in Django's `@transaction.atomic`. If any validation fails, the entire transaction rolls back.

### 2. Database-Enforced Stock Integrity (The Stock Guard)
* **Approach**: Relying solely on application-level checks to prevent negative stock values can lead to race conditions under concurrent workloads.
* **Implementation**: We implemented checks at two layers:
  - **Application Layer**: Serializers raise validation errors (`400 Bad Request`) if a sale transaction quantity exceeds available stock levels.
  - **Database Layer**: Added a check constraint `stock_guard_positive` (via `models.CheckConstraint(condition=models.Q(stock__gte=0))`) to ensure PostgreSQL rejects any transaction that would result in negative sub-variant quantities.

### 3. Automatic Sub-Variant Generation (Cartesian Product)
* **Approach**: When variants (e.g., Size, Color) or variant options (e.g., S, M, Red, Blue) are added or updated, the system must automatically regenerate the combinations of options without duplicating existing sub-variants or losing current stock metrics.
* **Implementation**: We use Python's `itertools.product` to calculate the Cartesian product of options. The code uses a differential update algorithm: it deletes combinations that are no longer valid, preserves matches that already exist, and safely creates missing variant sets.

### 4. Soft Deletion & Unique Namespace Guards
* **Approach**: When deleting a product, it must be soft-deleted (`is_deleted=True`) to maintain transaction history integrity. However, soft-deleted product codes and names should not block new products from reusing the same name or code.
* **Implementation**: When `delete()` is called, we append `_del_<uuid>` to both the `ProductCode` and `ProductName` fields. This frees up the namespace immediately while preserving history logs in the database.

### 5. Decoupled UI & Custom React Hooks
* **Approach**: Direct Axios calls inside UI elements scatter state management and make updates difficult to maintain.
* **Implementation**: We extracted all Axios queries, page changes, filter inputs, and debounced search routines into custom React hooks (`useProducts.js`, `useCategories.js`, `useStock.js`). The views focus exclusively on layouts and styling.

Enjoy exploring the application!
