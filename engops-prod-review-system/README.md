# EngOps Review System - Local Run

This version uses simple domain matching only.

No Docker MongoDB is required.
No Azure Client ID is required.
No Microsoft SSO is required.

Any email ending with `@selisegroup.com` can login and will be automatically stored in MongoDB.

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend runs on:

```text
http://localhost:4000
```

Default `.env` MongoDB:

```env
MONGODB_URI=mongodb://10.30.65.4:27017/engops-review-system?retryWrites=false&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000
ALLOWED_EMAIL_DOMAIN=selisegroup.com
```

## 2. Frontend setup

Open another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## 3. Test flow

1. Login as admin:

```text
admin@selisegroup.com
```

Select role: `Admin`.

2. Create a review form.

Required fields:

- Reviewer name
- Reviewer email
- Reviewee name
- Reviewee email

3. Copy the generated review link.

4. Logout.

5. Login as reviewer email.

6. Open the review link and submit.

7. Login as admin and check submissions.

## Important security note

Domain-only matching is okay for internal POC/local testing, but it does not prove the user owns the mailbox. For production, use Microsoft SSO or Email OTP.
