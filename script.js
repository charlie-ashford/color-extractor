let originalPalette = [];
let currentPalette = [];
let paletteState = 'default';

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getVibrancy(rgb) {
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  const saturation = max - min;
  const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return saturation * brightness;
}

function getMostVibrantColor(palette) {
  return palette.reduce(
    (mostVibrant, color) =>
      getVibrancy(color) > getVibrancy(mostVibrant) ? color : mostVibrant,
    palette[0]
  );
}

function getTextColorForBackground(rgb) {
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness > 125 ? '#333333' : '#ffffff';
}

function formatColorData(rgbArray) {
  const hex = rgbToHex(rgbArray[0], rgbArray[1], rgbArray[2]);
  const hsl = rgbToHsl(rgbArray[0], rgbArray[1], rgbArray[2]);

  return {
    rgbArray: rgbArray,
    hex: hex,
    rgb: `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hslObj: hsl,
    textColor: getTextColorForBackground(rgbArray),
  };
}

function generateColorHarmonies(color) {
  const hsl = color.hslObj;
  const harmonies = {
    complementary: [
      { h: hsl.h, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
    ],
    analogous: [
      { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
      { h: hsl.h, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l },
    ],
    triadic: [
      { h: hsl.h, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l },
    ],
    tetradic: [
      { h: hsl.h, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
      { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l },
    ],
    monochromatic: [
      { h: hsl.h, s: hsl.s, l: Math.max(0, hsl.l - 30) },
      { h: hsl.h, s: hsl.s, l: Math.max(0, hsl.l - 15) },
      { h: hsl.h, s: hsl.s, l: hsl.l },
      { h: hsl.h, s: hsl.s, l: Math.min(100, hsl.l + 15) },
      { h: hsl.h, s: hsl.s, l: Math.min(100, hsl.l + 30) },
    ],
  };

  const result = {};
  for (const [name, colors] of Object.entries(harmonies)) {
    result[name] = colors.map(hsl => {
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      return formatColorData(rgb);
    });
  }

  return result;
}

function sortPaletteByHue(palette) {
  return [...palette].sort((a, b) => {
    return a.hslObj.h - b.hslObj.h;
  });
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function generateCssVariables(colors) {
  const { vibrantColor, dominantColor, palette } = colors;
  let css = `:root {\n`;
  css += `  --primary-color: ${vibrantColor.hex};\n`;
  css += `  --primary-rgb: ${vibrantColor.rgbArray.join(', ')};\n`;
  css += `  --secondary-color: ${dominantColor.hex};\n`;
  css += `  --secondary-rgb: ${dominantColor.rgbArray.join(', ')};\n\n`;

  palette.forEach((color, index) => {
    css += `  --palette-${index + 1}: ${color.hex};\n`;
  });

  css += `\n  --text-on-primary: ${vibrantColor.textColor};\n`;
  css += `  --text-on-secondary: ${dominantColor.textColor};\n`;

  css += `}`;
  return css;
}

function extractChannelId(input) {
  if (input.includes('youtube.com') || input.includes('youtu.be')) {
    const channelMatch = input.match(
      /youtube\.com\/(channel|c|user|@)\/([^\/\?]+)/
    );
    if (channelMatch) {
      return channelMatch[2];
    }

    const videoMatch = input.match(/[?&]v=([^&]+)/);
    if (videoMatch) {
      return videoMatch[1];
    }
  }

  if (input.startsWith('@')) {
    return input;
  }

  return input;
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function saveToHistory(channelData, colorResults) {
  const history = JSON.parse(localStorage.getItem('channelHistory')) || [];

  const existingIndex = history.findIndex(
    item => item.channelId === channelData.channelDetails.id
  );

  const historyItem = {
    channelId: channelData.channelDetails.id,
    name: channelData.channelDetails.name,
    profilePicture: channelData.channelDetails.profilePicture,
    timestamp: new Date().toISOString(),
    colors: [
      colorResults.vibrantColor.hex,
      colorResults.dominantColor.hex,
      ...colorResults.palette.slice(0, 3).map(color => color.hex),
    ],
  };

  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }

  history.unshift(historyItem);

  const trimmedHistory = history.slice(0, 50);

  localStorage.setItem('channelHistory', JSON.stringify(trimmedHistory));

  updateHistoryUI();
}

function updateHistoryUI() {
  const historyContainer = document.getElementById('historyContainer');
  const historyItems = document.getElementById('historyItems');
  const history = JSON.parse(localStorage.getItem('channelHistory')) || [];

  if (history.length === 0) {
    historyContainer.style.display = 'none';
    return;
  }

  historyContainer.style.display = 'block';
  historyItems.innerHTML = '';

  history.forEach(item => {
    const timeAgo = getTimeAgo(new Date(item.timestamp));

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.channelId = item.channelId;

    historyItem.innerHTML = `
  <div class="history-thumbnail">
    <img src="${item.profilePicture}" alt="${item.name}">
  </div>
  <div class="history-info">
    <div class="history-channel-name">${item.name}</div>
    <div class="history-timestamp">${timeAgo}</div>
  </div>
  <div class="history-colors">
    ${item.colors
      .map(
        color =>
          `<div class="history-color" style="background-color: ${color}"></div>`
      )
      .join('')}
  </div>
`;

    historyItems.appendChild(historyItem);
  });
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  if (interval === 1) return '1 year ago';

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  if (interval === 1) return '1 month ago';

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';

  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';

  return 'just now';
}

function clearHistory() {
  localStorage.removeItem('channelHistory');
  updateHistoryUI();
  showToast('History cleared');
}

async function analyzePalette(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      try {
        const colorThief = new ColorThief();
        const dominantColor = colorThief.getColor(img);
        const palette = colorThief.getPalette(img, 8);

        const vibrantColor = getMostVibrantColor(palette);

        const dominantColorData = formatColorData(dominantColor);
        const vibrantColorData = formatColorData(vibrantColor);
        const paletteData = palette.map(color => formatColorData(color));

        const harmonies = generateColorHarmonies(vibrantColorData);

        resolve({
          dominantColor: dominantColorData,
          vibrantColor: vibrantColorData,
          palette: paletteData,
          harmonies: harmonies,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = function () {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

async function fetchChannelData(channelId) {
  try {
    const mixernoRes = await fetch(
      `https://mixerno.space/api/youtube-channel-counter/user/${channelId}`
    );
    if (!mixernoRes.ok) throw new Error('Mixerno API error');
    const mixernoData = await mixernoRes.json();

    const swRes = await fetch(
      `https://api.subscriberwars.space/youtube/channel/${channelId}`
    );
    if (!swRes.ok) throw new Error('Subscriber Wars API error');
    const swData = await swRes.json();

    const getCount = key =>
      mixernoData.counts.find(entry => entry.value === key)?.count;
    const getUser = key =>
      mixernoData.user.find(entry => entry.value === key)?.count;

    return {
      channelDetails: {
        id: channelId,
        name: getUser('name'),
        profilePicture: swData.icon,
        subscriberCount: getCount('apisubscribers'),
        videoCount: getCount('videos'),
        viewCount: getCount('apiviews'),
      },
    };
  } catch (error) {
    console.error('Error fetching channel data:', error);
    throw error;
  }
}

function formatNumber(num) {
  if (num === null || num === undefined) {
    return 'N/A';
  }

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(0) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(0) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}

function updateUI(channelData, colorResults) {
  const channelDetails = channelData.channelDetails;

  document.getElementById('channelName').textContent = channelDetails.name;
  document.getElementById('subscriberCount').textContent = formatNumber(
    channelDetails.subscriberCount
  );
  document.getElementById('videoCountValue').textContent = formatNumber(
    channelDetails.videoCount
  );
  document.getElementById('viewCountValue').textContent = formatNumber(
    channelDetails.viewCount
  );

  document.getElementById('profileImg').src = channelDetails.profilePicture;

  document.getElementById('channelBanner').style.backgroundColor =
    colorResults.vibrantColor.hex;

  document.getElementById('vibrantColorPreview').style.backgroundColor =
    colorResults.vibrantColor.hex;
  document.getElementById('dominantColorPreview').style.backgroundColor =
    colorResults.dominantColor.hex;

  document.getElementById('vibrantHexValue').textContent =
    colorResults.vibrantColor.hex;
  document.getElementById('vibrantRgbValue').textContent =
    colorResults.vibrantColor.rgb;
  document.getElementById('vibrantHslValue').textContent =
    colorResults.vibrantColor.hsl;

  document.getElementById('dominantHexValue').textContent =
    colorResults.dominantColor.hex;
  document.getElementById('dominantRgbValue').textContent =
    colorResults.dominantColor.rgb;
  document.getElementById('dominantHslValue').textContent =
    colorResults.dominantColor.hsl;

  originalPalette = [...colorResults.palette];
  currentPalette = [...colorResults.palette];
  paletteState = 'default';

  updatePaletteGrid(currentPalette);
  updateHarmonies(colorResults.harmonies);
  document.getElementById('resultsContainer').classList.add('visible');
}

function updatePaletteGrid(paletteToDisplay) {
  const paletteGrid = document.getElementById('paletteGrid');
  paletteGrid.innerHTML = '';

  paletteToDisplay.forEach((color, index) => {
    const colorElement = document.createElement('div');
    colorElement.className = 'palette-color';
    colorElement.style.backgroundColor = color.hex;

    colorElement.innerHTML = `
<div class="palette-color-content" style="color: ${color.textColor}">
  <div class="palette-color-hex">${color.hex}</div>
  <div class="palette-color-index">#${index + 1}</div>
</div>
<div class="palette-color-copy">
  <i class="fas fa-copy"></i>
  <div class="palette-color-copy-text">Copy HEX</div>
</div>
`;

    colorElement.addEventListener('click', () => {
      navigator.clipboard.writeText(color.hex);
      showToast(`Copied ${color.hex} to clipboard`);
    });

    paletteGrid.appendChild(colorElement);
  });
}

function updateHarmonies(harmonies) {
  const harmonySchemes = document.getElementById('harmonySchemes');
  harmonySchemes.innerHTML = '';

  const harmonyNames = {
    complementary: 'Complementary',
    analogous: 'Analogous',
    triadic: 'Triadic',
    tetradic: 'Tetradic',
    monochromatic: 'Monochromatic',
  };

  const harmonyIcons = {
    complementary: 'fa-circle-half-stroke',
    analogous: 'fa-grip-lines',
    triadic: 'fa-share-alt',
    tetradic: 'fa-object-group',
    monochromatic: 'fa-tint',
  };

  for (const [key, colors] of Object.entries(harmonies)) {
    const schemeElement = document.createElement('div');
    schemeElement.className = 'harmony-scheme';

    const schemeTitle = document.createElement('h4');
    schemeTitle.className = 'scheme-title';
    schemeTitle.innerHTML = `<i class="fas ${harmonyIcons[key]}"></i> ${harmonyNames[key]}`;

    const schemeColors = document.createElement('div');
    schemeColors.className = 'scheme-colors';

    colors.forEach(color => {
      const colorElement = document.createElement('div');
      colorElement.className = 'scheme-color';
      colorElement.style.backgroundColor = color.hex;

      const copyElement = document.createElement('div');
      copyElement.className = 'scheme-color-copy';
      copyElement.innerHTML = '<i class="fas fa-copy"></i>';

      colorElement.appendChild(copyElement);

      colorElement.addEventListener('click', () => {
        navigator.clipboard.writeText(color.hex);
        showToast(`Copied ${color.hex} to clipboard`);
      });

      schemeColors.appendChild(colorElement);
    });

    schemeElement.appendChild(schemeTitle);
    schemeElement.appendChild(schemeColors);
    harmonySchemes.appendChild(schemeElement);
  }
}

async function searchChannelByName(query) {
  try {
    const response = await fetch(
      `https://mixerno.space/api/youtube-channel-counter/search/${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) {
      throw new Error('Search API error');
    }

    const data = await response.json();

    if (data.list && data.list.length > 0) {
      return data.list[0][2];
    } else {
      throw new Error('No channels found with that name');
    }
  } catch (error) {
    throw error;
  }
}

function isValidChannelId(id) {
  return id.startsWith('UC');
}

function updateUrlWithChannelId(channelId) {
  const url = new URL(window.location.href);
  url.searchParams.set('id', channelId);
  url.searchParams.delete('type');
  window.history.pushState({ channelId }, '', url);
}

function getChannelIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

async function analyzeChannel(channelIdOrName) {
  try {
    clearUploadedImage();
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('resultsContainer').classList.remove('visible');

    let channelId;
    const lowerCaseInput = channelIdOrName.toLowerCase().trim();

    if (lowerCaseInput === 'the goat') {
      channelId = 'UC-lHJZR3Gqxm24_Vd_AJ5Yw';
    } else {
      channelId = extractChannelId(channelIdOrName);

      if (!isValidChannelId(channelId) && !channelId.startsWith('@')) {
        try {
          channelId = await searchChannelByName(channelIdOrName);
        } catch (searchError) {
          console.error('Search error:', searchError);
        }
      }
    }

    const channelData = await fetchChannelData(channelId);
    const colorResults = await analyzePalette(
      channelData.channelDetails.profilePicture
    );

    updateUI(channelData, colorResults);
    saveToHistory(channelData, colorResults);
    updateUrlWithChannelId(channelData.channelDetails.id);

    document.querySelector('.channel-card').style.display = 'flex';
    document.getElementById('subscribers').style.display = 'flex';
    document.getElementById('videoCount').style.display = 'flex';
    document.getElementById('viewCount').style.display = 'flex';

    return { channelData, colorResults };
  } catch (error) {
    document.getElementById('errorMessage').textContent = error.message;
    document.getElementById('errorMessage').style.display = 'block';
    console.error(error);
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

function setupImageUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const imageUpload = document.getElementById('imageUpload');
  const uploadedPreview = document.getElementById('uploadedPreview');
  const uploadedImage = document.getElementById('uploadedImage');
  const removeImage = document.getElementById('removeImage');
  const uploadContent = document.querySelector('.upload-content');
  const originalText = uploadContent.querySelector('p').textContent;
  let activeContextMenu = null;

  uploadArea.addEventListener('click', () => {
    imageUpload.click();
  });

  imageUpload.addEventListener('change', handleFileSelect);

  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');

    uploadContent.querySelector('i').className = 'fas fa-file-import';
    uploadContent.querySelector('p').textContent = 'Drop image here';
    uploadContent.classList.add('drop-active');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');

    uploadContent.querySelector('i').className = 'fas fa-cloud-upload-alt';
    uploadContent.querySelector('p').textContent = originalText;
    uploadContent.classList.remove('drop-active');
  });

  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    uploadContent.classList.remove('drop-active');

    uploadContent.querySelector('i').className = 'fas fa-cloud-upload-alt';
    uploadContent.querySelector('p').textContent = originalText;

    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  });

  removeImage.addEventListener('click', e => {
    e.stopPropagation();
    uploadedPreview.classList.remove('visible');
    uploadedImage.src = '';
    imageUpload.value = '';
  });

  document.addEventListener('paste', e => {
    const activeElement = document.activeElement;
    const isInput =
      activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

    if (!isInput) {
      handlePaste(e);
    }
  });

  uploadArea.addEventListener('contextmenu', e => {
    e.preventDefault();

    if (activeContextMenu) {
      document.body.removeChild(activeContextMenu);
      activeContextMenu = null;
    }

    const contextMenu = document.createElement('div');
    contextMenu.className = 'custom-context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" id="pasteImage">
        <i class="fas fa-paste"></i> Paste Image
      </div>
    `;

    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;

    document.body.appendChild(contextMenu);
    activeContextMenu = contextMenu;

    document.getElementById('pasteImage').addEventListener('click', () => {
      navigator.clipboard
        .read()
        .then(clipboardItems => {
          for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
              if (type.startsWith('image/')) {
                clipboardItem.getType(type).then(blob => {
                  handleImageFile(blob);
                  showToast('Image pasted from clipboard');
                });
                break;
              }
            }
          }
        })
        .catch(err => {
          console.error('Failed to read clipboard: ', err);
          showToast('Please use Ctrl+V to paste image');
        })
        .finally(() => {
          if (activeContextMenu) {
            document.body.removeChild(activeContextMenu);
            activeContextMenu = null;
          }
        });

      if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
      }
    });

    const closeMenu = e => {
      if (activeContextMenu && !activeContextMenu.contains(e.target)) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  });

  document.addEventListener('click', e => {
    if (
      activeContextMenu &&
      !activeContextMenu.contains(e.target) &&
      e.button !== 2
    ) {
      document.body.removeChild(activeContextMenu);
      activeContextMenu = null;
    }
  });

  document.addEventListener(
    'scroll',
    () => {
      if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
      }
    },
    true
  );
}

function handlePaste(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;

  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      const blob = item.getAsFile();
      handleImageFile(blob);
      showToast('Image pasted from clipboard');
      break;
    }
  }
}

function clearUploadedImage() {
  const uploadedPreview = document.getElementById('uploadedPreview');
  const uploadedImage = document.getElementById('uploadedImage');
  const imageUpload = document.getElementById('imageUpload');

  uploadedPreview.classList.remove('visible');
  uploadedImage.src = '';
  imageUpload.value = '';
}

function handleFileSelect(e) {
  if (e.target.files.length) {
    handleFiles(e.target.files);
  }
}

function handleFiles(files) {
  const file = files[0];

  if (!file.type.match('image.*')) {
    showToast('Please select an image file');
    return;
  }

  document.getElementById('channelIdInput').value = '';

  handleImageFile(file);
}

function handleImageFile(file) {
  document.getElementById('channelIdInput').value = '';
  const reader = new FileReader();

  reader.onload = async e => {
    try {
      const uploadedPreview = document.getElementById('uploadedPreview');
      const uploadedImage = document.getElementById('uploadedImage');

      uploadedImage.src = e.target.result;
      uploadedPreview.classList.add('visible');

      await analyzeUploadedImage(e.target.result);
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('Error processing image');
    }
  };

  reader.readAsDataURL(file);
}

async function analyzeUploadedImage(imageUrl) {
  try {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('resultsContainer').classList.remove('visible');

    const colorResults = await analyzePalette(imageUrl);

    const channelData = {
      channelDetails: {
        id: 'uploaded_' + Date.now(),
        name: 'Uploaded Image',
        profilePicture: imageUrl,
        subscriberCount: null,
        videoCount: null,
        viewCount: null,
      },
    };

    updateUI(channelData, colorResults);

    document.getElementById('subscribers').style.display = 'none';
    document.getElementById('videoCount').style.display = 'none';
    document.getElementById('viewCount').style.display = 'none';
    document.querySelector('.channel-card').style.display = 'none';

    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    url.searchParams.set('type', 'upload');
    window.history.pushState({ type: 'upload' }, '', url);

    return { channelData, colorResults };
  } catch (error) {
    document.getElementById('errorMessage').textContent = error.message;
    document.getElementById('errorMessage').style.display = 'block';
    console.error(error);
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');

  themeToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', isDarkMode);

    if (document.getElementById('cssModal').classList.contains('show')) {
      applyModalDarkMode();
    }
  });

  if (localStorage.getItem('darkMode') !== 'false') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  setupEventListeners();
  setupImageUpload();
  updateHistoryUI();

  const urlChannelId = getChannelIdFromUrl();
  if (urlChannelId) {
    document.getElementById('channelIdInput').value = urlChannelId;
    analyzeChannel(urlChannelId);
  } else {
    fetch('ids.txt')
      .then(response => response.text())
      .then(text => {
        const channelIds = text.split('\n').filter(id => id.trim() !== '');

        const randomChannel =
          channelIds[Math.floor(Math.random() * channelIds.length)];
        document.getElementById('channelIdInput').value = randomChannel;
        analyzeChannel(randomChannel);
      })
      .catch(error => {
        console.error('Error loading channel IDs:', error);
        analyzeChannel('UCX6OQ3DkcsbYNE6H8uQQuVA');
      });
  }
});

function setupEventListeners() {
  window.addEventListener('popstate', function (event) {
    if (event.state && event.state.channelId) {
      document.getElementById('channelIdInput').value = event.state.channelId;
      analyzeChannel(event.state.channelId);
    } else if (event.state && event.state.type === 'upload') {
    } else {
      const urlChannelId = getChannelIdFromUrl();
      if (urlChannelId) {
        document.getElementById('channelIdInput').value = urlChannelId;
        analyzeChannel(urlChannelId);
      }
    }
  });

  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.addEventListener('click', function () {
    const channelId = document.getElementById('channelIdInput').value.trim();
    if (channelId) {
      clearUploadedImage();
      analyzeChannel(channelId);
    } else {
      document.getElementById('errorMessage').textContent =
        'Please enter a YouTube channel ID or name';
      document.getElementById('errorMessage').style.display = 'block';
    }
  });

  const exampleChips = document.querySelectorAll('.example-chip');
  exampleChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const channelId = this.dataset.id;
      document.getElementById('channelIdInput').value = channelId;
      clearUploadedImage();
      analyzeChannel(channelId);
    });
  });

  const channelIdInput = document.getElementById('channelIdInput');
  channelIdInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const channelId = this.value.trim();
      if (channelId) {
        clearUploadedImage();
        analyzeChannel(channelId);
      }
    }
  });

  document
    .getElementById('shufflePaletteBtn')
    .addEventListener('click', function () {
      currentPalette = shuffleArray(currentPalette);
      paletteState = 'shuffled';
      document.getElementById('sortPaletteBtn').classList.remove('active-sort');
      updatePaletteGrid(currentPalette);
      showToast('Palette shuffled');
    });

  document
    .getElementById('sortPaletteBtn')
    .addEventListener('click', function () {
      if (paletteState === 'sorted') {
        currentPalette = [...originalPalette];
        paletteState = 'default';
        this.classList.remove('active-sort');
      } else {
        currentPalette = sortPaletteByHue(currentPalette);
        paletteState = 'sorted';
        this.classList.add('active-sort');
      }
      updatePaletteGrid(currentPalette);
      showToast(
        paletteState === 'sorted' ? 'Palette sorted by hue' : 'Palette reset'
      );
    });

  document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      const valueId = this.dataset.value;
      const value = document.getElementById(`${valueId}Value`).textContent;
      navigator.clipboard.writeText(value);

      if (!this.dataset.originalText) {
        this.dataset.originalText = this.textContent.trim();
      }

      this.textContent = 'Copied!';

      clearTimeout(this.resetTimeout);
      this.resetTimeout = setTimeout(() => {
        this.textContent = this.dataset.originalText;
      }, 1500);
    });
  });

  document
    .getElementById('exportCssBtn')
    .addEventListener('click', function () {
      const cssModal = document.getElementById('cssModal');
      const cssCode = document.getElementById('cssCode');
      const modalTitle = document.querySelector('.modal-title');
      modalTitle.textContent = 'CSS Variables';
      applyModalDarkMode();

      const vibrantRgb = document
        .getElementById('vibrantRgbValue')
        .textContent.match(/\d+/g)
        .map(Number);
      const dominantRgb = document
        .getElementById('dominantRgbValue')
        .textContent.match(/\d+/g)
        .map(Number);

      const paletteColors = currentPalette.map(color =>
        formatColorData(color.rgbArray)
      );

      const colors = {
        vibrantColor: formatColorData(vibrantRgb),
        dominantColor: formatColorData(dominantRgb),
        palette: paletteColors,
      };

      cssCode.textContent = generateCssVariables(colors);
      cssModal.classList.add('show');
    });

  document
    .getElementById('exportPngBtn')
    .addEventListener('click', exportPaletteImage);

  const cssModal = document.getElementById('cssModal');
  cssModal.addEventListener('click', function (event) {
    if (event.target === cssModal) {
      cssModal.classList.remove('show');
    }
  });

  document
    .getElementById('closeCssModal')
    .addEventListener('click', function () {
      document.getElementById('cssModal').classList.remove('show');
    });

  document.getElementById('copyCssBtn').addEventListener('click', function () {
    const cssCode = document.getElementById('cssCode').textContent;
    navigator.clipboard.writeText(cssCode);
    showToast('Copied to clipboard');
  });

  document
    .getElementById('clearHistoryBtn')
    .addEventListener('click', clearHistory);

  document
    .getElementById('historyItems')
    .addEventListener('click', function (e) {
      const historyItem = e.target.closest('.history-item');
      if (historyItem) {
        const channelId = historyItem.dataset.channelId;
        document.getElementById('channelIdInput').value = channelId;
        clearUploadedImage();
        analyzeChannel(channelId);
      }
    });
}

function applyModalDarkMode() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const modalContent = document.querySelector('.modal-content');
  const cssCode = document.getElementById('cssCode');

  if (isDarkMode) {
    modalContent.style.backgroundColor = 'var(--dark-mode-card)';
    modalContent.style.color = 'var(--dark-mode-text)';
    cssCode.style.backgroundColor = 'var(--dark-mode-input)';
    cssCode.style.color = 'var(--dark-mode-text)';
  } else {
    modalContent.style.backgroundColor = 'var(--card-bg)';
    modalContent.style.color = '#333';
    cssCode.style.backgroundColor = '#f5f5f5';
    cssCode.style.color = '#333';
  }
}

function exportPaletteImage() {
  const paletteColors = currentPalette.map(color => color.hex);
  const channelName = document.getElementById('channelName').textContent;
  const vibrantColor = document.getElementById('vibrantColorPreview').style
    .backgroundColor;
  const dominantColor = document.getElementById('dominantColorPreview').style
    .backgroundColor;
  const profileImgSrc = document.getElementById('profileImg').src;

  function adjustColorBrightness(color, percent) {
    const rgb = color.match(/\d+/g).map(Number);

    const adjustedRgb = rgb.map(value => {
      const adjusted = Math.max(0, Math.min(255, value + percent));
      return Math.round(adjusted);
    });

    return `rgb(${adjustedRgb[0]}, ${adjustedRgb[1]}, ${adjustedRgb[2]})`;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const darkerVibrant = adjustColorBrightness(vibrantColor, -50);
  const darkerDominant = adjustColorBrightness(dominantColor, -50);
  gradient.addColorStop(0, darkerVibrant);
  gradient.addColorStop(1, darkerDominant);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, width, height);

  const img = new Image();
  img.crossOrigin = 'Anonymous';

  function drawPalette(hasProfileImage = false) {
    document.fonts.load('bold 48px "Inter"').then(() => {
      const topSectionHeight = 220;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, topSectionHeight, width, 2);

      const imgSize = 160;
      const imgX = 80;
      const imgY = (topSectionHeight - imgSize) / 2;

      const textX = hasProfileImage ? imgX + imgSize + 40 : 80;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.textAlign = 'left';
      ctx.font = 'bold 48px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(channelName, textX, imgY + imgSize / 2);

      ctx.font = '20px "Inter", sans-serif';
      ctx.fillText('Color Palette', textX, imgY + imgSize / 2 + 50);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      const paletteStartY = topSectionHeight + 50;
      const paletteHeight = 200;
      const paletteMargin = 80;
      const paletteWidth = width - paletteMargin * 2;
      const colorWidth = paletteWidth / paletteColors.length;

      paletteColors.forEach((color, index) => {
        const x = paletteMargin + index * colorWidth;
        const y = paletteStartY;
        const radius = 15;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + colorWidth - radius, y);
        ctx.quadraticCurveTo(x + colorWidth, y, x + colorWidth, y + radius);
        ctx.lineTo(x + colorWidth, y + paletteHeight - radius);
        ctx.quadraticCurveTo(
          x + colorWidth,
          y + paletteHeight,
          x + colorWidth - radius,
          y + paletteHeight
        );
        ctx.lineTo(x + radius, y + paletteHeight);
        ctx.quadraticCurveTo(
          x,
          y + paletteHeight,
          x,
          y + paletteHeight - radius
        );
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(
          color.toUpperCase(),
          x + colorWidth / 2,
          y + paletteHeight + 35
        );
      });

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${channelName
          .replace(/\s+/g, '-')
          .toLowerCase()}-palette.png`;
        link.href = dataUrl;
        link.click();
      } catch (e) {
        console.error('Error exporting image:', e);
        showToast("Couldn't export image due to CORS restrictions.");
      }
    });
  }

  img.onload = function () {
    const topSectionHeight = 220;
    const imgSize = 160;
    const imgX = 80;
    const imgY = (topSectionHeight - imgSize) / 2;

    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(
      imgX + imgSize / 2,
      imgY + imgSize / 2,
      imgSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);

    ctx.restore();

    drawPalette(true);
  };

  img.onerror = function () {
    console.log("Couldn't load profile image, drawing without it");
    drawPalette(false);
  };

  img.src = profileImgSrc;
}
