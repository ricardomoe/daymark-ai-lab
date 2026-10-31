const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const venueName = 'Bella Vista Events by Juliana Anschau';
const contactInformation = {
  Email: { text: 'Juliana@churrasco.online', href: 'mailto:Juliana@churrasco.online' },
  Phone: { text: '604-404-1562', href: 'tel:+16044041562' },
  WhatsApp: { text: '604-404-1562', href: 'https://wa.me/16044041562' },
  'Venue location': { text: 'Golden Ears Provincial Park, 24480 Fern Crescent, Maple Ridge, BC V4R 2S1' },
};

document.querySelectorAll('.main-nav, .footer-links').forEach(navigation => {
  if (navigation.querySelector('a[href="book-visit.html"]')) return;
  const link = document.createElement('a');
  link.href = 'book-visit.html';
  link.textContent = 'Book a visit';
  navigation.append(link);
});

document.querySelectorAll('.main-nav a[href="contact.html"]').forEach(link => {
  link.textContent = 'Meet Us';
});

document.querySelectorAll('.main-nav, .footer-links').forEach(navigation => {
  if (navigation.querySelector('a[href="location.html"]')) return;
  const link = document.createElement('a');
  link.href = 'location.html';
  link.textContent = 'Find Us';
  navigation.insertBefore(link, navigation.querySelector('a[href="book-visit.html"]'));
});

const venueAddress = contactInformation['Venue location'].text;
document.querySelectorAll('[data-location-address]').forEach(address => {
  address.textContent = venueAddress;
});
document.querySelectorAll('[data-location-map]').forEach(map => {
  const apiKey = document.querySelector('meta[name="google-maps-embed-api-key"]')?.content.trim();
  if (!apiKey) return;
  const destination = new URL('https://www.google.com/maps/embed/v1/place');
  destination.searchParams.set('key', apiKey);
  destination.searchParams.set('q', venueAddress);
  destination.searchParams.set('zoom', '16');
  map.src = destination.href;
  map.hidden = false;
  const status = document.querySelector('[data-location-map-status]');
  if (status) status.hidden = true;
});
document.querySelectorAll('[data-location-directions], [data-location-map-link]').forEach(link => {
  const directions = link.hasAttribute('data-location-directions');
  const destination = new URL(directions ? 'https://www.google.com/maps/dir/' : 'https://www.google.com/maps/search/');
  destination.searchParams.set('api', '1');
  destination.searchParams.set(directions ? 'destination' : 'query', venueAddress);
  link.href = destination.href;
});

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
  if (mark.closest('.site-header')) {
    mark.textContent = 'YOUR EVENT VENUE · BRITISH COLUMBIA';
  } else {
    mark.remove();
  }
});
document.querySelectorAll('.wordmark[aria-label]').forEach(mark => {
  mark.setAttribute('aria-label', mark.closest('.site-header') ? 'Bella Vista event venue home' : `${venueName} home`);
});
document.querySelectorAll('.manager-banner').forEach(banner => {
  banner.textContent = 'A beautiful setting for your celebration · British Columbia';
});
document.querySelectorAll('.footer-links a[href="contact.html"]').forEach(link => {
  link.textContent = 'Contact Us';
});
document.querySelectorAll('.footer-contact p').forEach(row => {
  if (row.querySelector('span')?.textContent.trim() === 'Event Manager') {
    row.remove();
  }
});
document.querySelectorAll('.footer-bottom span').forEach(element => {
  element.childNodes.forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    node.textContent = node.textContent
      .replaceAll(venueName, 'Bella Vista')
      .replaceAll('Thoughtfully hosted by Juliana Anschau', 'Thoughtfully hosted at Bella Vista');
  });
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

document.querySelectorAll('.wedding-carousel').forEach(carousel => {
  const viewport = carousel.querySelector('.carousel-viewport');
  const photos = [...viewport.querySelectorAll('img')];
  const dotContainer = carousel.querySelector('.carousel-dots');
  const status = carousel.querySelector('.carousel-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;

  const showPhoto = index => {
    const nextIndex = (index + photos.length) % photos.length;
    viewport.scrollTo({
      left: nextIndex * viewport.clientWidth,
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  };

  const dots = photos.map((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carousel-dot';
    button.setAttribute('aria-label', `Show wedding photo ${index + 1}`);
    button.setAttribute('aria-controls', viewport.id);
    button.title = `Photo ${index + 1}`;
    button.addEventListener('click', () => showPhoto(index));
    dotContainer.append(button);
    return button;
  });

  const updateSelection = () => {
    currentIndex = Math.max(0, Math.min(photos.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === currentIndex)));
    status.textContent = `${currentIndex + 1} / ${photos.length}`;
  };

  carousel.querySelector('[data-carousel-previous]').addEventListener('click', () => showPhoto(currentIndex - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => showPhoto(currentIndex + 1));
  viewport.addEventListener('scroll', updateSelection, { passive: true });
  carousel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations = { ArrowLeft: currentIndex - 1, ArrowRight: currentIndex + 1, Home: 0, End: photos.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    showPhoto(destinations[event.key]);
  });
  new ResizeObserver(() => {
    viewport.scrollTo({ left: currentIndex * viewport.clientWidth, behavior: 'instant' });
  }).observe(viewport);
  carousel.querySelector('.carousel-controls').hidden = false;
  status.hidden = false;
  updateSelection();
});

const visitForm = document.getElementById('visitForm');
if (visitForm) {
  const visitDate = document.getElementById('visitDate');
  const visitStatus = document.getElementById('visitStatus');
  const whatsAppLink = document.getElementById('visitWhatsApp');
  const todayInPacific = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  visitDate.min = todayInPacific();
  visitForm.addEventListener('input', () => {
    visitStatus.textContent = '';
    whatsAppLink.hidden = true;
    whatsAppLink.removeAttribute('href');
    visitForm.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
  });
  visitForm.addEventListener('submit', event => {
    event.preventDefault();
    visitDate.min = todayInPacific();
    ['visitName', 'visitPhone'].forEach(id => {
      const input = document.getElementById(id);
      input.setCustomValidity(input.value.trim() ? '' : 'Please enter your contact information.');
    });
    if (!visitForm.reportValidity()) return;
    const details = Object.fromEntries(new FormData(visitForm));
    const message = [
      'Hello Juliana! I would like to visit Bella Vista Events.',
      '',
      `Preferred visit date: ${details.date}`,
      `Preferred time (Pacific): ${details.time || 'Flexible'}`,
      `Name: ${details.name.trim()}`,
      `Email: ${details.email.trim()}`,
      `Phone: ${details.phone.trim()}`,
      `Celebration: ${details.event || 'Not specified'}`,
      '',
      details.message.trim(),
      '',
      'Please let me know if this date works. I understand the visit needs confirmation.',
    ].join('\n');
    const destination = new URL(contactInformation.WhatsApp.href);
    destination.searchParams.set('text', message);
    whatsAppLink.href = destination.href;
    whatsAppLink.hidden = false;
    visitStatus.textContent = 'Your request is ready. Send it in WhatsApp so Juliana can confirm your visit.';
    window.open(destination.href, '_blank', 'noopener,noreferrer');
  });
}

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
