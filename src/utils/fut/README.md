# FUT Export Utilities

This module provides functionality to export FUT (Formato Único de Trámites) requests to PDF format with a design that resembles official Peruvian government documents.

## Features

1. **List Export**: Export multiple FUT requests to a single PDF document
2. **Individual Export**: Export a single FUT request as an official-looking document
3. **Institution Branding**: Include institution logo and information in the documents
4. **Student Information**: Automatically include student details with photo placeholders
5. **Guardian Information**: Display guardian/solicitor details
6. **Signature Sections**: Include designated areas for signatures
7. **Official Peruvian Design**: Follows the standard FUT format used in Peruvian institutions

## Usage

### Exporting Multiple FUT Requests

```javascript
import FutExportUtils from './utils/fut/exportUtils';

// Export filtered requests (institution data is automatically retrieved)
FutExportUtils.exportFutRequestsToPDF(filteredRequests, students);
```

### Exporting Individual FUT Request

```javascript
import FutExportUtils from './utils/fut/exportUtils';

// Export single request (institution data is automatically retrieved)
FutExportUtils.exportFutRequestToOfficialPDF(futRequest, student);
```

## Parameters

- `futRequests`: Array of FUT request objects
- `students`: Array of student objects
- `institution`: Institution details object (name, address, etc.) - optional, will be retrieved automatically
- `futRequest`: Single FUT request object
- `student`: Student object associated with the request

## Visual Enhancements

The export utilities now include several visual improvements:

1. **School Logo**: The actual school logo uploaded in the system is displayed in the document header
2. **Student Photo Placeholders**: Placeholder areas for student photos
3. **Improved Styling**: Better typography and layout following official document standards
4. **Section Headers**: Clear section divisions with underlined titles
5. **Peruvian Government Styling**: Official styling with Peruvian government elements

## How It Works

The export utilities automatically retrieve the institution data from the authentication service. If a logo has been uploaded for the institution, it will be displayed in the PDF documents. If no logo is available, a placeholder will be shown.

The institution data includes:
- Institution name
- Address
- Contact information
- Logo (if uploaded)

## Customization

The export utilities can be customized by modifying the CSS styles in the HTML template strings within the export functions. The current design includes:

- Official Peruvian government document styling
- Institution branding with actual school logo
- Student and guardian information sections
- Signature areas for both the requester and institution
- Proper formatting for dates, statuses, and urgency levels
- Photo placeholders for student images

## Dependencies

- None (uses browser built-in functionality for PDF generation)
- Institution data from the authentication service