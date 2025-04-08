from unittest.mock import patch, MagicMock
from api.utils import email_utils


@patch("smtplib.SMTP")
def test_send_invite_email_success(mock_smtp):
    # Arrange
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server

    recipient_email = "test@example.com"
    first_name = "Jane"
    last_name = "Doe"
    invite_link = "http://localhost/invite/abc123"

    # Act
    email_utils.send_invite_email(recipient_email, first_name, last_name, invite_link)

    # Assert
    mock_smtp.assert_called_once_with(email_utils.SMTP_SERVER, email_utils.SMTP_PORT)
    mock_server.send_message.assert_called_once()
    sent_message = mock_server.send_message.call_args[0][0]

    # Verify content
    assert recipient_email in sent_message["To"]
    assert "You're invited" in sent_message["Subject"]
    assert invite_link in sent_message.get_content()


@patch("smtplib.SMTP", side_effect=Exception("SMTP server error"))
def test_send_invite_email_failure(mock_smtp):
    # Should not raise an exception, but log/print an error
    email_utils.send_invite_email(
        "fail@example.com", "Error", "Case", "http://localhost/fail"
    )

    mock_smtp.assert_called_once()
