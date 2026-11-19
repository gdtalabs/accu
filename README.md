# ACCU Doctor Billing, Lab Ordering & Cashier Handoff

Adds the client-requested clinic flow:

- audible Reception -> Doctor patient-queue alerts;
- audible Doctor -> Reception Ready/Done alerts;
- doctor-specific queues remain separate;
- simple queue numbers remain in the UI;
- Physician enters exact PF;
- Physician can select Laboratory tests directly from the service catalog;
- selected tests create a Lab order automatically;
- Reception receives the patient's next step and amount;
- Cashier receives a sanitized pending-charge handoff;
- Cashier can load PF + selected lab charges into the existing POS;
- existing Cash / GCash / Maya / Bank Transfer / Other payment methods are retained;
- Cashier never needs access to the physician's diagnosis/assessment to collect payment.
