from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
# No need for get_user_model() here unless the utility needs to fetch users itself,
# which is generally not the case for a generic sender.

# If you plan to use Celery for async sending, this is where your task would be.
# from celery import shared_task # Assuming you have Celery set up

def send_templated_email(
    subject,
    template_name_txt,
    template_name_html,
    recipient_list,
    context=None, # Make context optional, default to empty dict
    from_email=None,
    fail_silently=False,
    # Add any other common email parameters you might need
):
    """
    Sends an email using Django's EmailMultiAlternatives, rendering content
    from specified plain text and HTML templates.

    Args:
        subject (str): The subject line of the email.
        template_name_txt (str): Path to the plain text email template (e.g., 'emails/welcome_email.txt').
        template_name_html (str): Path to the HTML email template (e.g., 'emails/welcome_email.html').
        recipient_list (list): A list of recipient email addresses.
        context (dict, optional): A dictionary of context variables to pass to the templates. Defaults to None.
        from_email (str, optional): The sender's email address. Defaults to settings.DEFAULT_FROM_EMAIL.
        fail_silently (bool, optional): Whether to suppress exceptions during email sending. Defaults to False.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    if context is None:
        context = {} # Ensure context is a dictionary

    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    try:
        # Render email content from templates
        html_content = render_to_string(template_name_html, context)
        text_content = render_to_string(template_name_txt, context)

        # Create the email message
        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")

        msg.send(fail_silently=fail_silently)
        print(f"Email '{subject}' sent to {', '.join(recipient_list)}") # For debugging
        return True
    except Exception as e:
        print(f"Error sending email '{subject}' to {', '.join(recipient_list)}: {e}") # For debugging
        # In a real application, you would use a proper logging system here
        if not fail_silently:
            raise # Re-raise if not failing silently
        return False


# --- ASYNCHRONOUS TASK (If you're using Celery) ---
# If you decide to go asynchronous, you'd define a Celery task here
# that wraps the send_templated_email function.

# @shared_task
# def send_templated_email_async(
#     subject, template_name_txt, template_name_html, recipient_list, context=None, from_email=None, fail_silently=False
# ):
#     # Call the main synchronous email sending function
#     send_templated_email(
#         subject, template_name_txt, template_name_html, recipient_list, context, from_email, fail_silently
#     )

def send_password_reset_success_email(user):
    """
    Send a confirmation email after successful password reset
    """
    context = {
        'user': user,
    }
    
    subject = 'Password Reset Successful'
    text_content = render_to_string('emails/password_reset_email.txt', context)
    html_content = render_to_string('emails/password_reset_email.html', context)
    
    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [user.email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()