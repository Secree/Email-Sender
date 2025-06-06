import React, { useState, useRef } from 'react';
import { Button, TextField, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
// import AttachFileIcon from '@mui/icons-material/AttachFile'; // removed
import { useSnackbar }  from './SnackbarContext'; 
import './EmailForm.css';

function EmailForm() {
  const [form, setForm] = useState({ email: '', message: '' });
  const [errors, setErrors] = useState({ email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState(16); // default font size in px
  // const [attachment, setAttachment] = useState(null); // removed
  const { showSnackbar } = useSnackbar();
  const messageRef = useRef(null);

  // Utility: Check if cursor is inside a single, unclosed tag of the given type
  const isInsideSingleTag = (tag) => {
    const textarea = messageRef.current;
    if (!textarea) return false;
    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart !== selectionEnd) return false;
    const before = value.substring(0, selectionStart);

    // Count number of open and close tags before the cursor
    const openTag = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    const closeTag = new RegExp(`</${tag}>`, 'gi');
    let openCount = 0, closeCount = 0, match;
    while ((match = openTag.exec(before)) !== null) openCount++;
    while ((match = closeTag.exec(before)) !== null) closeCount++;

    // Only true if there is exactly one more open than close (i.e., inside a single tag)
    return openCount - closeCount === 1;
  };

  // Remove the nearest enclosing tag of the given type around the cursor
  const removeNearestTag = (tag) => {
    const textarea = messageRef.current;
    if (!textarea) return;
    const { selectionStart, value } = textarea;

    // Find the last open tag before the cursor
    const openTagRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    let lastOpenTagIdx = -1, openMatch;
    while ((openMatch = openTagRegex.exec(value.substring(0, selectionStart))) !== null) {
      lastOpenTagIdx = openMatch.index;
    }
    if (lastOpenTagIdx === -1) return;

    // Find the corresponding close tag after the cursor
    const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
    closeTagRegex.lastIndex = selectionStart;
    const closeMatch = closeTagRegex.exec(value);
    if (!closeMatch) return;

    // Remove the open and close tags
    const openTagMatch = value.substring(lastOpenTagIdx).match(openTagRegex);
    const openTagLength = openTagMatch ? openTagMatch[0].length : 0;
    const closeTagIdx = closeMatch.index;
    const closeTagLength = closeMatch[0].length;

    const before = value.substring(0, lastOpenTagIdx);
    const inside = value.substring(lastOpenTagIdx + openTagLength, closeTagIdx);
    const after = value.substring(closeTagIdx + closeTagLength);

    const newValue = before + inside + after;
    setForm((prev) => ({ ...prev, message: newValue }));

    // Set cursor position after removing tags
    setTimeout(() => {
      const pos = before.length + inside.length;
      textarea.focus();
      textarea.setSelectionRange(before.length, before.length);
    }, 0);
  };

  // Insert or remove tag at selection in textarea
  const toggleTag = (tag) => {
    if (isInsideSingleTag(tag)) {
      removeNearestTag(tag);
    } else {
      insertTag(tag);
    }
  };

  // Insert or remove alignment div at cursor or selection in textarea
  const toggleAlignment = (align) => {
    if (isInsideSingleTag('div')) {
      removeNearestTag('div');
    } else {
      insertAlignment(align);
    }
  };

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Remove handleAttachmentChange
  // const handleAttachmentChange = (e) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setAttachment(e.target.files[0]);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = { email: '', message: '' };

    if (!form.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Enter a valid email';
      valid = false;
    }

    if (!form.message) {
      newErrors.message = 'Message is required';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    setSubmitting(true);
    try {
      // Only send JSON, no FormData
      const body = JSON.stringify({
        ...form,
        message: `<span style="font-size: ${fontSize}px">${form.message}</span>`
      });
      const headers = { 'Content-Type': 'application/json' };

      const res = await fetch('http://localhost:4000/send-email', {
        method: 'POST',
        headers,
        body
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSnackbar('Email sent successfully!', 'success');
        setForm({ email: '', message: '' });
        // setAttachment(null); // removed
      } else {
        showSnackbar(data.error || 'Failed to send email. Please try again.', 'error');
      }
     } catch (error) {
      console.error('Error sending email:', error);
      showSnackbar('An unexpected error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Utility: Highlight tags green and text white for preview
  const getHighlightedHtml = (input) => {
    if (!input) return '';
    // Replace tags with green span, text with white span
    return input
      .replace(/(<[^>]+>)/g, match => `<span style="color: #4caf50;">${match}</span>`)
      .replace(/(?<=<\/?[a-zA-Z][^>]*>)([^<]+)/g, match => `<span style="color: #fff;">${match}</span>`);
  };

  // Insert tag at selection in textarea
  const insertTag = (tag) => {
    const textarea = messageRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.substring(0, selectionStart);
    const selected = value.substring(selectionStart, selectionEnd);
    const after = value.substring(selectionEnd);
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    const newValue = before + openTag + selected + closeTag + after;
    setForm((prev) => ({ ...prev, message: newValue }));
    // Restore selection inside the tags
    setTimeout(() => {
      const pos = selectionStart + openTag.length;
      textarea.focus();
      textarea.setSelectionRange(pos, pos + selected.length);
    }, 0);
  };

  // Insert alignment div at cursor or selection in textarea
  const insertAlignment = (align) => {
    const textarea = messageRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    let before = value.substring(0, selectionStart);
    let selected = value.substring(selectionStart, selectionEnd);
    let after = value.substring(selectionEnd);

    // If nothing selected, insert empty div at cursor
    if (selectionStart === selectionEnd) {
      const openTag = `<div style="text-align: ${align}"></div>`;
      const newValue = before + openTag + after;
      setForm((prev) => ({ ...prev, message: newValue }));
      // Place cursor inside the new div
      setTimeout(() => {
        const pos = before.length + openTag.length - 6; // -6 puts cursor before </div>
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      }, 0);
    } else {
      // Wrap selected text in div
      const openTag = `<div style="text-align: ${align}">`;
      const closeTag = `</div>`;
      const newValue = before + openTag + selected + closeTag + after;
      setForm((prev) => ({ ...prev, message: newValue }));
      // Restore selection inside the tags
      setTimeout(() => {
        const pos = before.length + openTag.length;
        const end = pos + selected.length;
        textarea.focus();
        textarea.setSelectionRange(pos, end);
      }, 0);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <div className="email-form-title">
        <span className="email-form-title-main">Email Sender</span>
        <span className="email-form-title-by">by Jan Jonas Sta. Ana</span>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div
          className="email-form-container"
          style={{
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <TextField
            fullWidth
            type="email"
            name="email"
            label="Email"
            variant="outlined"
            margin="normal"
            value={form.email}
            onChange={handleChange}
            required
            error={!!errors.email}
            helperText={errors.email}
          />
          <div className="email-form-toolbar">
            <Tooltip title="Bold">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleTag('b')}
                tabIndex={-1}
                size="small"
              >
                <FormatBoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleTag('i')}
                tabIndex={-1}
                size="small"
              >
                <FormatItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleTag('u')}
                tabIndex={-1}
                size="small"
              >
                <FormatUnderlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align left">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleAlignment('left')}
                tabIndex={-1}
                size="small"
              >
                <FormatAlignLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align center">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleAlignment('center')}
                tabIndex={-1}
                size="small"
              >
                <FormatAlignCenterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align right">
              <IconButton
                className="toolbar-btn"
                onClick={() => toggleAlignment('right')}
                tabIndex={-1}
                size="small"
              >
                <FormatAlignRightIcon />
              </IconButton>
            </Tooltip>
            {/* Remove attachment button and file name display */}
            {/* ...existing code... */}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
              <label htmlFor="font-size-input" style={{ color: '#90caf9', fontSize: '0.95rem', marginRight: 4 }}>
                Font size
              </label>
              <input
                id="font-size-input"
                type="number"
                min={10}
                max={48}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                style={{
                  width: 48,
                  background: '#181b20',
                  color: '#e0e0e0',
                  border: '1px solid #444857',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: '1rem'
                }}
              />
              <span style={{ color: '#90caf9', marginLeft: 2, fontSize: '0.95rem' }}>px</span>
            </div>
          </div>
          <textarea
            ref={messageRef}
            className="email-form-textarea"
            name="message"
            placeholder="Message"
            value={form.message}
            onChange={handleChange}
            required
            rows={4}
            style={{
              marginTop: '8px',
              marginBottom: '8px',
              border: errors.message ? '1px solid #ff6f61' : undefined,
              fontSize: `${fontSize}px`,
              background: '#181b20',
              color: '#fff'
            }}
          />
          {/* Preview with only green border and text content (no tags) */}
          <div
            style={{
              border: '2px solid #4caf50',
              padding: '8px',
              borderRadius: 4,
              marginBottom: 8,
              minHeight: 40,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              position: 'relative'
            }}
          >
            <span style={{
              position: 'absolute',
              top: 4,
              left: 12,
              fontSize: '0.95rem',
              color: '#4caf50',
              background: '#181b20',
              padding: '0 4px'
            }}>
              Preview
            </span>
            <div style={{ paddingTop: 18 }}>
              {form.message.replace(/<[^>]+>/g, '')}
            </div>
          </div>
          {errors.message && (
            <div style={{ color: '#ff6f61', fontSize: '0.85rem', marginTop: '-8px', marginBottom: '8px' }}>
              {errors.message}
            </div>
          )}
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            style={{ marginTop: '20px' }}
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EmailForm;