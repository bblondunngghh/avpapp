# CSV Import Templates

These CSV templates are designed for you to manually populate data and then import into your Access Valet Parking application database.

## How to Use These Templates

1. Download the desired template file (right-click and select "Save As" or equivalent in your browser)
2. Open the file in a spreadsheet program like Microsoft Excel, Google Sheets, or LibreOffice Calc
3. Fill in your data following the column headers (See explanations below)
4. Save the file as CSV format
5. Use the application's import functionality to upload the data

## Template Explanations

### employees_template.csv
- **key**: A unique identifier for the employee (e.g., "employee1")
- **fullName**: The employee's full name
- **isActive**: TRUE if currently employed, FALSE otherwise
- **isShiftLeader**: TRUE if the employee is a shift leader, FALSE otherwise
- **phone**: Employee's phone number (optional)
- **email**: Employee's email address (optional)
- **hireDate**: Date of hire in YYYY-MM-DD format
- **notes**: Any additional notes about the employee (optional)

### shift_reports_template.csv
- **locationId**: ID of the location (1=Capital Grille, 2=Bob's, 3=Truluck's, 4=BOA)
- **date**: Date of the shift in YYYY-MM-DD format
- **shift**: "Lunch" or "Dinner"
- **manager**: Name of the shift leader/manager
- **totalCars**: Total number of cars serviced
- **complimentaryCars**: Number of complimentary cars (no charge)
- **creditTransactions**: Number of credit card transactions
- **totalCreditSales**: Total dollar amount of credit card sales
- **totalReceipts**: Total number of receipts
- **totalCashCollected**: Total dollar amount of cash collected
- **companyCashTurnIn**: Dollar amount turned in to the company
- **totalTurnIn**: Total of credit sales and cash turn-in
- **overShort**: Difference between cash collected and cash turn-in
- **totalJobHours**: Total employee hours worked for the shift
- **notes**: Any general notes about the shift (optional)
- **incidents**: Any incident reports for the shift (optional)

### ticket_distributions_template.csv
- **locationId**: ID of the location (1=Capital Grille, 2=Bob's, 3=Truluck's, 4=BOA)
- **allocatedTickets**: Number of tickets allocated to the location
- **usedTickets**: Number of tickets already used
- **batchNumber**: Batch identifier for the ticket allocation
- **notes**: Any additional notes about the distribution (optional)

### users_template.csv
- **username**: Username for login
- **password**: Password for login (Note: the actual system will hash this password)

## Important Notes
- Do not modify the header row (first row) of any template
- Dates should always be in YYYY-MM-DD format (e.g., 2023-05-15)
- Boolean values should be either TRUE or FALSE (all caps)
- Money values should be entered without the dollar sign (e.g., 125.50 not $125.50)
- Employee data in shift reports is handled separately in the application and is not part of this CSV

## Location ID Reference
1. The Capital Grille
2. Bob's Steak and Chop House
3. Truluck's
4. BOA Steakhouse