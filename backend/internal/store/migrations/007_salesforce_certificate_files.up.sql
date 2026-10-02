UPDATE content_items SET data=json_set(
  data,
  '$.attachment_url','/certifications/salesforce-agentforce-specialist-certificate.pdf'
) WHERE kind='certifications' AND slug='salesforce-agentforce';

UPDATE content_items SET data=json_set(
  data,
  '$.attachment_url','/certifications/salesforce-platform-administrator-certificate.pdf'
) WHERE kind='certifications' AND slug='salesforce-admin';
