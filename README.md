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

## 🔒 Authentication
To access the system, you must log in.
Navigate to the frontend (`http://localhost:5173`), and use your **superuser** credentials to access the Dashboard and manage inventory.

## 🌟 Key Features

1. **Dashboard Analytics**: Visualize total stock, running balances, and product distributions with interactive Recharts.
2. **Cartesian Product Generator**: Automatically generates all unique combinations of sub-variants whenever variant options (e.g., Size, Color) are added to a product.
3. **Smart Stock Guard**: Backend validation ensures stock quantities strictly remain non-negative.
4. **Atomic Transactions**: Ensures database integrity so partial data isn't saved when generating variants.
5. **Real-time Synchronization**: Stock transactions automatically trigger Django signals to adjust SubVariant stock and the parent Product `TotalStock` perfectly in sync. 

Enjoy exploring the application!
