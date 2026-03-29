<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    <h2>Email Verification</h2>
    <p>Hi {{ $userName }},</p>
    <p>Use the code below to verify your email. It expires in <strong>10 minutes</strong>.</p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                background: #f4f4f4; padding: 20px; text-align: center;
                border-radius: 8px; margin: 20px 0;">
        {{ $otp }}
    </div>
    <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email.</p>
</body>
</html>