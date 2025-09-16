
# Buyer Lead Intake App - Frontend

A Next.js + TypeScript frontend for managing buyer leads.

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies
```bash
npm install
```

### Environment Configuration
```bash
cp .env.local.example .env.local
```
Update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Start Frontend Server
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Demo Accounts:
  - User: `demo@example.com` / `demo123`
  - Admin: `admin@example.com` / `demo123`

## Features
- CRUD Operations
- Search & Filter
- Pagination
- Validation with Zod
- CSV Import/Export
- User Ownership and Audit Trail

## State Management
- React Context for auth state
- URL state for filters and pagination
- Local component state

## Error Handling
- Error Boundaries
- Validation Errors
- API Errors

## Testing
```bash
npm test
```

## Production Deployment

- Build: `npm run build`
- Serve: `npm start`
- Can deploy to Vercel or Netlify

## Performance Considerations

- Server-side rendering
- Pagination
- Efficient API calls
- Caching static assets

## Security Measures

- JWT authentication
- Input validation
- CORS configuration
- Rate limiting

## Future Enhancements

- Real-time notifications
- Mobile app
- Analytics dashboard
- CRM integrations

## Contributing

1. Fork the repo
2. Create branch: `git checkout -b feature/new-feature`
3. Commit: `git commit -am 'Add new feature'`
4. Push: `git push origin feature/new-feature`
5. Create pull request

## License

MIT License - see LICENSE file for details.

