# ActiveCampaign Email Verification Setup

This guide explains how to configure ActiveCampaign for email verification in Human Farm.

## Overview

The email verification system uses ActiveCampaign's automation feature to send verification emails. When a user registers:

1. A verification token is generated and stored in the database
2. The verification link is stored as a custom field in ActiveCampaign
3. A tag (`hf-needs-verification`) is added to the contact
4. An AC automation triggers on this tag and sends the verification email
5. When the user clicks the link and verifies, the tag is replaced with `hf-email-verified`

## Step 1: Create Custom Fields in ActiveCampaign

Go to **Lists > Manage Fields** and create these custom fields:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| `hf_verification_link` | Text | Stores the full verification URL |
| `hf_verification_token` | Text | Stores the verification token |

After creating, note the field IDs (visible in the URL when editing) and add them to your `.env`:

```env
AC_FIELD_VERIFICATION_LINK=<field_id>
AC_FIELD_VERIFICATION_TOKEN=<field_id>
```

## Step 2: Create the Verification Email Template

Go to **Campaigns > Manage Templates** and create a new template:

**Subject:** Verify your Human Farm account

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 30px;">
        <h1 style="color: #F2EDE5; font-size: 24px; margin: 0;">human.farm</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #242424; border-radius: 12px; padding: 40px;">
        <h2 style="color: #F2EDE5; font-size: 20px; margin: 0 0 20px 0;">Verify your email</h2>
        <p style="color: #999; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hey %FIRSTNAME%,
        </p>
        <p style="color: #999; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Welcome to Human Farm! Click the button below to verify your email address and activate your account.
        </p>
        <a href="%HF_VERIFICATION_LINK%" style="display: inline-block; background-color: #4EEADB; color: #1a1a1a; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
          Or copy and paste this link:<br>
          <a href="%HF_VERIFICATION_LINK%" style="color: #4EEADB; word-break: break-all;">%HF_VERIFICATION_LINK%</a>
        </p>
        <p style="color: #666; font-size: 12px; margin: 30px 0 0 0;">
          This link expires in 24 hours.
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 30px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Human Farm — The Human Execution Layer
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Step 3: Create the Automation

Go to **Automations > Create an Automation** and set up:

### Trigger
- **Start Trigger:** Tag is added
- **Tag:** `hf-needs-verification`

### Actions
1. **Send an email**
   - Use the template you created above
   - From: Human Farm <noreply@human.farm> (or your verified sender)

2. **Wait** (optional)
   - Wait 24 hours (to allow for resend requests)

3. **End this automation**

### Settings
- **Run:** Once per contact
- **Status:** Active

## Step 4: Environment Variables

Ensure these environment variables are set:

```env
# ActiveCampaign API
ACTIVECAMPAIGN_API_URL=https://youraccountname.api-us1.com
ACTIVECAMPAIGN_API_KEY=your_api_key_here
ACTIVECAMPAIGN_LIST_ID=1

# Custom field IDs (optional - will auto-create if not set)
AC_FIELD_VERIFICATION_LINK=
AC_FIELD_VERIFICATION_TOKEN=

# App URL for verification links
NEXT_PUBLIC_APP_URL=https://human.farm
```

## Step 5: Test the Flow

1. Register a new user
2. Check ActiveCampaign to verify:
   - Contact was created
   - `hf-needs-verification` tag was added
   - Custom fields were populated
3. Check that the automation triggered
4. Click the verification link in the email
5. Verify the tag changed to `hf-email-verified`

## Tags Used

| Tag | Description |
|-----|-------------|
| `hf-needs-verification` | Added when user registers, triggers verification email |
| `hf-email-verified` | Added after successful verification |
| `hf-no-referrals` | Default tag for users without referrals |
| `hf-has-referrals` | Added when user gets their first referral |

## Troubleshooting

### Email not sending
- Check that the automation is active
- Verify the trigger tag matches exactly (`hf-needs-verification`)
- Check the contact has the tag in ActiveCampaign

### Verification link not working
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check the custom field value in ActiveCampaign
- Verify the token hasn't expired (24 hours)

### Contact not created
- Check ActiveCampaign API credentials
- Look at server logs for API errors
- Verify the list ID is correct
