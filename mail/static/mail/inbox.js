document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
  showInbox('inbox');

});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    compose();
    const mailbox = 'sent';
    history.pushState({mailbox: mailbox}, '', `/emails/${mailbox}`);
    load_mailbox(mailbox)
    showSent(mailbox);
    return false;
  };

}


function compose() {
  const recpt = document.querySelector('#compose-recipients').value;
  const subj = document.querySelector('#compose-subject').value;
  const bd = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recpt,
        subject: subj,
        body:  bd
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  });

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  document.querySelectorAll('.mail').forEach(mail => {
    mail.onclick = function() {
      const mailbox = this.dataset.emails;
      history.pushState({mailbox: mailbox}, '', `/emails/${mailbox}`);

      if (mailbox == 'inbox') {
        console.log(mailbox);
        showInbox(mailbox);
      }
      else if (mailbox == 'sent') {
        console.log(mailbox);
        showSent(mailbox);
      }
      else if (mailbox == 'archive') {
        console.log(mailbox);
        showArchived(mailbox);
      }
      else {
        document.querySelector('#emails-view').innerHTML = `<h3>Invalid Entry</h3>`;
      }
    };
  });

  // Compose mail
  document.querySelector('#compose').onclick = function() {
    history.pushState({mailbox: mailbox}, '', '/emails');   
  };
}



function showInbox(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    emails.forEach(email => {
      
      let read = email.read;
      let div = document.createElement("div");
      if (read == false) {
        div.className = 'mail_style';
      }
      else {
        div.className = 'unread';
      }
      div.innerHTML +=`<span id='viewelement${email.id}'>
                        <strong  class="subject" >${email.subject}</strong> 
                        <span class="time"> 
                        From: ${email.sender} &nbsp;  &nbsp;&nbsp;&nbsp;
                        Time: ${email.timestamp} 
                        </span>
                      </span>
                      <button id='archive_mail${email.id}' class=" btn btn-primary btn-sm archive">Archive</button>
                      
                    `;

      document.querySelector('#emails-view').appendChild(div);

      var email_id = `${email.id}`;
      
      // Show single email
      document.querySelector(`#viewelement${email_id}`).addEventListener('click', () => {
        document.querySelector('#emails-view').innerHTML = '';
        singleMail(email_id);
      });

      // archive email
      document.querySelector(`#archive_mail${email_id}`).onclick = () => {
        archive(email_id);
        const element = document.querySelector(`#archive_mail${email_id}`);
        element.parentElement.style.animationPlayState = 'running';
          element.parentElement.addEventListener('animationend', () => {
            element.parentElement.remove();
          });
      };

    });
  });
}


// show a single email
function singleMail(email_id) {
    history.pushState({email_id: email_id}, '', `/emails/${email_id}`);
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {

      let div = document.createElement("div");
      div.className = 'single_mail';
      div.innerHTML = `
                      <br>
                      <p><strong> From: &nbsp;&nbsp; ${email.sender}</strong></p>
                      <p><strong> To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${email.recipients}</strong></p>
                      <p><strong>Time: &nbsp;&nbsp; ${email.timestamp} </strong></p> <hr>
                      <h5><strong>Subject: &nbsp;&nbsp; ${email.subject} </strong></h5> <hr>
                      <h5> <strong> Body: </strong></h5>
                      ${email.body}.
                      <hr>
                      <button id='reply${email_id}' class="btn btn-primary btn-sm"> Reply</button> 
                      `;
      document.querySelector('#emails-view').appendChild(div);

      read(email_id);

      document.querySelector(`#reply${email_id}`).onclick = () => {
        load_compose(email);
      };

    });
}

// set to read
function read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}


function load_compose(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  var mailbox;
  history.pushState({mailbox: mailbox}, '', '/emails');

  // Clear out composition fields
  var sender = document.querySelector('#compose-recipients');
  var subject = document.querySelector('#compose-subject');
  var body = document.querySelector('#compose-body');
  
  subj = email.subject;
  var pos = subj.search("Re: ");

  sender.value = email.sender;
  body.value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: ' + ' ' + email.body;
  
  if (pos < 0) {
    subject.value = 'Re: ' + email.subject;
  }
  else {
    subject.value = email.subject;
  }

  document.querySelector('#compose-form').onsubmit = () => {
    compose();
    const mailbox = 'sent';
    history.pushState({mailbox: mailbox}, '', `/emails/${mailbox}`);
    load_mailbox(mailbox)
    showSent(mailbox);
    return false;
  };

}



//show sent mails
function showSent(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    emails.forEach(email => {
      let div = document.createElement("div");
      div.className = 'mail_style'; 
      div.innerHTML += `
                          <strong class="subject" >${email.subject}</strong> 
                          <span class="time"> 
                            To: ${email.recipients} &nbsp;  &nbsp;&nbsp;&nbsp;
                            Time: ${email.timestamp} 
                          </span>

                        `;

      document.querySelector('#emails-view').appendChild(div);

    });
  });
}


function archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
}


function showArchived(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    emails.forEach(email => {
      const archived = email.archived;
      if (archived == true) {
        let read = email.read;
        let div = document.createElement("div");
        if (read == false) {
          div.className = 'mail_style';
        }
        else {
          div.className = 'unread';
        }
        div.innerHTML += `
                          <strong id='viewelement${email.id}' class="subject" >${email.subject}</strong> 
                          <span class="time"> 
                            From: ${email.sender} &nbsp;  &nbsp;&nbsp;&nbsp;
                            Time: ${email.timestamp} 
                          </span>
                          <button id='unarchive_mail${email.id}' class="btn btn-primary btn-sm archive">Unarchive</button>
                       
                          `;       
        document.querySelector('#emails-view').appendChild(div);
      } 

      var email_id = `${email.id}`;
      document.querySelector(`#unarchive_mail${email_id}`).onclick = () => {
        const element = document.querySelector(`#unarchive_mail${email_id}`);
        element.parentElement.style.animationPlayState = 'running';
        element.parentElement.addEventListener('animationend', () => {
          element.parentElement.remove();
          add_to_inbox(email_id);
          go_to_inbox();
        });

      };

    });
  });
}

// Add mail to Inbox
function add_to_inbox(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
}

// Go to Inbox
function go_to_inbox() {
  const mailbox = 'inbox';
  history.pushState({mailbox: mailbox}, '', `/emails/${mailbox}`);
  load_mailbox(mailbox);
  showInbox(mailbox);
}
