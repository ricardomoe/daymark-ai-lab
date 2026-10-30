const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const venueName = 'Bella Vista Events by Juliana Anschau';
const contactInformation = {
  Email: { text: 'Juliana@churrasco.online', href: 'mailto:Juliana@churrasco.online' },
  Phone: { text: '604-404-1562', href: 'tel:+16044041562' },
  WhatsApp: { text: '604-404-1562', href: 'https://wa.me/16044041562' },
  'Venue location': { text: 'Golden Ears Provincial Park, 24480 Fern Crescent, Maple Ridge, BC V4R 2S1' },
};

document.title = document.title.replaceAll('Alder & Summit', venueName);
document.querySelectorAll('meta[name="description"]').forEach(meta => {
  meta.content = meta.content.replaceAll('Alder & Summit', venueName);
});

const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (textWalker.nextNode()) {
  textWalker.currentNode.textContent = textWalker.currentNode.textContent
    .replaceAll('Alder & Summit', venueName)
    .replaceAll('Alder and Summit', venueName)
    .replaceAll('ALDER & SUMMIT', venueName.toUpperCase());
}

document.querySelectorAll('.wordmark-main').forEach(mark => {
  mark.textContent = 'BELLA VISTA';
});
document.querySelectorAll('.wordmark-sub').forEach(mark => {
  mark.textContent = 'EVENTS BY JULIANA ANSCHAU';
});
document.querySelectorAll('.wordmark[aria-label]').forEach(mark => {
  mark.setAttribute('aria-label', `${venueName} home`);
});

document.querySelectorAll('.footer-contact p, .contact-details li').forEach(row => {
  const label = row.querySelector('span')?.textContent.trim();
  const detail = contactInformation[label];
  const value = row.querySelector('strong, a');
  if (!detail || !value) return;
  value.textContent = detail.text;

  if (value instanceof HTMLAnchorElement && detail.href) {
    const currentHref = value.getAttribute('href') || '';
    const query = currentHref.includes('?') ? currentHref.slice(currentHref.indexOf('?')) : '';
    value.href = label === 'Email' ? `${detail.href}${query}` : detail.href;
  }
});

document.querySelectorAll('[data-contact-email]').forEach(link => {
  const currentHref = link.getAttribute('href') || '';
  const query = currentHref.includes('?') ? currentHref.slice(currentHref.indexOf('?')) : '';
  link.href = `${contactInformation.Email.href}${query}`;
});
document.querySelectorAll('[data-contact-phone]').forEach(link => {
  link.href = contactInformation.Phone.href;
});
document.querySelectorAll('[data-contact-whatsapp]').forEach(link => {
  link.href = contactInformation.WhatsApp.href;
});

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('is-open', !expanded);
  });

  mainNav.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    menuButton.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('is-open');
  });
}

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
  const query = new URLSearchParams(window.location.search);
  const eventSelect = document.getElementById('inquiryEvent');
  const eventTypes = {
    wedding: 'Wedding',
    corporate: 'Corporate event',
    birthday: 'Birthday',
  };
  const selectedEvent = eventTypes[query.get('event')];

  if (selectedEvent) eventSelect.value = selectedEvent;
  if (query.has('package')) {
    const packageName = query.get('package').replaceAll('-', ' ');
    document.getElementById('inquiryMessage').value = `I am interested in the ${packageName} package.`;
  }

  inquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(inquiryForm));
    const emailLabel = document.querySelector('.contact-manager-card [data-contact-email]')?.textContent.trim() || '';
    const recipient = emailLabel.startsWith('[') ? '' : emailLabel;
    const subject = `${details.event || 'Venue'} inquiry from ${details.name}`;
    const body = [
      `Name: ${details.name}`,
      `Email: ${details.email}`,
      `Event: ${details.event || 'Not specified'}`,
      `Preferred date: ${details.date || 'Not specified'}`,
      `Guest count: ${details.guests || 'Not specified'}`,
      '',
      details.message || '',
    ].join('\n');

    document.getElementById('formStatus').textContent = recipient
      ? 'Your email app is opening with the inquiry details.'
      : 'Your email app will open with a draft. Add Juliana’s email address in the Contact Information before publishing.';
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
