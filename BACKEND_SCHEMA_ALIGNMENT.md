# NUK RentServe — Frontend / Backend Schema Alignment

This document describes the MongoDB/Mongoose models in `NUKBackend-main/src/models` and the frontend workflows that use them. The existing Express backend remains the source of truth; do not create a second database schema in the frontend.

## Main collections

### User (`User.js`)
- `name`: string, required, 2–100 characters
- `email`: normalized lowercase string, unique and required
- `phone`: string, optional/default empty
- `password`: bcrypt hash, excluded from normal query results
- `role`: `customer | owner | provider | admin`
- `location`: string, default `Bagalkot`
- `isActive`: boolean
- `refreshTokenHash`: private refresh-token hash
- `googleId`: optional unique sparse Google subject identifier

Used by registration, login, account, owner, provider and admin workflows. Public registration must never grant `provider` or `admin` roles.

### ProviderApplication (`ProviderApplication.js`)
- `userId`: reference to `User`
- `fullName`, `phone`, `email`
- `dob`: Date; required and retained for age-eligibility review
- `address`, `serviceArea`, `city`, `taluk`, `district`
- `profileImage`: `{ url, publicId }`
- `vehicleImages`: array of `{ url, publicId }`; up to 5; at least one for transport categories
- `category`, `experience`, `price`, `description`, `consent`
- `aadhaarDocument`: private Cloudinary document metadata only; no raw identity document is returned to the frontend
- `status`: `pending | info | approved | rejected`
- `reviewNote`, identity-review metadata

The provider registration form submits multipart data to the existing provider registration endpoint. `dob` is validated as age 18+ and stored on the application. Provider accounts have only the Provider Dashboard and Contact Support pages; no provider-facing service-listing page is required.

### ServiceProvider (`ServiceProvider.js`)
- `userId`, `displayName`, `bio`, `skills`, `experienceYears`
- `verificationStatus`: `unverified | pending | info | verified | rejected`
- `reviewNote`, `profileImage`, `vehicleImages`

### ServiceListing (`ServiceListing.js`)
- `providerId`: `User` reference
- `categoryId`: `ServiceCategory` reference
- `title`, `description`, `location`
- `priceRange`: `{ min, max }`, with `min <= max`
- `payUnit`: `hour | day | week | month | fixed`
- `workHours`, `images` array of `{ url, publicId }`
- `availability`, `status`: `draft | published | filled | closed`

Service listings are generated/managed according to the existing backend approval workflow. Do not add a separate provider service-listing page to the frontend.

### ServiceCategory (`ServiceCategory.js`)
- `name`, unique `slug`, `description`, `isActive`

The provider application category must match an active category record for automatic service-listing creation on approval. Seed/maintain active category records for the categories the product intends to offer; the application form's text value alone does not create a category.

### Property (`Property.js`)
- `ownerId`: `User` reference
- `type`: `house | shop | room | PG`
- `title`, `description`, `rent`, `deposit`, `rentPeriod`
- `address`, `location`, `facilities`, `images`
- `availability`, `status`: `draft | published | rented | closed`

### Booking (`Booking.js`)
- `customerId`, `ownerId`, `propertyId`
- `requestedMoveInDate`, `message`
- `status`: `pending | accepted | rejected | cancelled`

### TransportBooking (`TransportBooking.js`)
- `customerId`, optional `providerId`
- `vehicleType`: `auto | car | goods-van`
- `pickup`, `destination`, `scheduledAt`, `details`
- `status`: `pending | accepted | rejected | cancelled`
- `providerNote`, `declinedBy`

### Enquiry (`Enquiry.js`)
- `customerId`, `listingId`, `listingType`: `service | property`
- `message`, `contactStatus`: `pending | contacted | accepted | rejected | closed`

### Review (`Review.js`)
- `reviewerId`, `listingId`, `listingType`: `service | property`
- `rating`: 1–5, `comment`

### SupportTicket (`SupportTicket.js`)
- `userId`, `subject`, `category`, `message`
- `category`: `account | application | booking | payment | technical | other`
- `status`: `open | in_progress | resolved | closed`, `adminNote`

### Other models
- `JobApplication`: application records for existing job features.
- `PasswordResetToken`: hashed password reset token and expiration.
- `EmailOtp`: legacy/optional registration OTP data model; customer registration currently does not require OTP in the updated form/controller.

## API integration rules
- API base URL is configured with `VITE_API_BASE_URL`; local default: `http://localhost:5000/api/v1`.
- API response envelopes use the existing `ApiResponse` structure. Frontend helpers should unwrap the actual response payload rather than assume raw arrays.
- Image uploads must use the existing server-side Cloudinary integration. Never expose Cloudinary API secrets in frontend code.
- Never trust frontend roles or IDs for authorization; enforce ownership and role checks in backend controllers.
- A declared route is not proof a complete workflow works. Test route, controller, model validation, authentication, response handling and frontend form together.

## Important setup note
The schema files define the data model; they do not automatically create required category records. Ensure active `ServiceCategory` documents exist for provider categories before approving applications if approval is expected to create a public service listing.
