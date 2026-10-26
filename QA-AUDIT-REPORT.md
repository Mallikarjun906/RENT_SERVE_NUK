# NUK RentServe update — QA status

## Implemented
- Replaced the homepage hero with the existing Karnataka/Hampi heritage artwork while retaining the home photograph for the rental category card.
- Added restrained entrance/hover animations and reduced-motion handling.
- Improved the transport page with clearer auto, passenger-car and goods-van cards, Kannada headings, and an explained request lifecycle.
- Added one clearly marked removable demo transport listing. It is local demonstration data, not a real provider or a real booking.
- Removed the fixed eight-city datalist from the homepage search; location fields are free text.
- Changed provider registration location inputs to free-text city, taluk and district.
- Made profile photo upload mandatory for provider applications and vehicle photos mandatory for Auto, Passenger car and Goods van applications.
- Updated backend provider-application schema, upload middleware, Cloudinary image handling, and tests for new fields and image requirements.
- Set the frontend production API base to the user's existing Render URL.

## Checks completed
- `node --check` passed for the modified backend controller, models, middleware and provider-auth test file.
- `tsc` JSX parse check completed with no diagnostics for the modified React source files.
- `tinycss2` parsed the full stylesheet with no syntax errors.
- CSS parsed successfully with no syntax errors.
- ZIP integrity is checked after packaging.

## Not verified
- Frontend production build and Jest suite were not run because npm registry DNS resolution failed (`EAI_AGAIN registry.npmjs.org`) in the environment.
- Live Render health/API response and live Cloudinary upload were not verified.
- Deploy the backend source changes to Render before testing provider registration. The existing deployed backend does not update merely because the source ZIP changes.
- Configure and verify `VITE_GOOGLE_CLIENT_ID` and the matching backend `GOOGLE_CLIENT_ID` before expecting Google authentication to work.
