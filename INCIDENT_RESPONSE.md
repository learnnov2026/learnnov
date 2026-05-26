# Incident Response Plan

**Last Updated:** [Date]

## 1. Preparation
- **Team:** Security Officer, System Administrator, Legal Counsel.
- **Tools:** ZAP, ClamAV, Audit logs, Nginx access logs.

## 2. Identification
If an alert is triggered (e.g., suspicious login spikes, malware upload detection, high load on database):
- Verify the alert.
- Classify the severity (Low, Medium, High, Critical).
- Notify the Security Officer and necessary stakeholders.

## 3. Containment
- **Short-term:** Isolate affected containers/servers from the network. Block malicious IPs via firewall/Nginx. Force password resets for compromised accounts.
- **Long-term:** Patch the vulnerability. Apply security updates.

## 4. Eradication
- Remove malicious files (e.g., using ClamAV).
- Restore clean configurations from Git repository.
- Delete any unauthorized accounts or backdoors.

## 5. Recovery
- Restore data from the latest clean backup if necessary.
- Gradually reconnect services to the network.
- Monitor closely for 48 hours.

## 6. Post-Incident Review
- Document the incident timeline.
- Identify the root cause.
- Update policies and technical controls to prevent recurrence.
- Notify regulatory bodies within 72 hours if a data breach occurred (per GDPR/PDPL).
