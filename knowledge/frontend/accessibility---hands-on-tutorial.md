---
title: "Accessibility - Hands-on Tutorial"
category: "frontend"
date: "2026-07-09"
---

# Accessibility - Hands-on Tutorial  

## What is it?  
Accessibility (often abbreviated as **a11y**) refers to designing and developing software that is usable by people with disabilities, including visual, auditory, motor, or cognitive impairments. This tutorial provides practical steps to implement accessibility in web applications.  

## Why it matters  
- **Legal compliance**: Many regions (e.g., ADA, WCAG) require accessible software.  
- **Inclusivity**: Ensures all users, regardless of ability, can interact with your product.  
- **Better UX**: Often improves usability for all users (e.g., keyboard navigation, clear labels).  

## How it works  
Key accessibility practices include:  
1. **Semantic HTML** – Use proper elements (`<button>`, `<nav>`, `<header>`) for structure.  
2. **Keyboard Navigation** – Ensure all interactive elements are focusable and operable via keyboard.  
3. **ARIA Attributes** – Enhance semantics where HTML falls short (`aria-label`, `aria-live`).  
4. **Contrast & Readability** – Text must meet WCAG contrast ratios (minimum 4.5:1 for normal text).  
5. **Screen Reader Testing** – Validate with tools like NVDA, VoiceOver, or JAWS.  

## Example  

### **1. Semantic HTML**  
```html
<!-- Bad: Non-semantic div as a button -->
<div onclick="submitForm()">Submit</div>

<!-- Good: Proper button element -->
<button onclick="submitForm()">Submit</button>
```

### **2. Keyboard Navigation**  
Ensure focus states are visible and logical:  
```css
button:focus {
  outline: 2px solid #0066cc;
}
```

### **3. ARIA for Dynamic Content**  
```html
<!-- Alert screen readers when content updates -->
<div aria-live="polite" id="status-message"></div>
<script>
  document.getElementById("status-message").textContent = "Form submitted!";
</script>
```

### **4. Contrast Check**  
Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify text readability.  

### **5. Screen Reader Test**  
- **NVDA (Windows)**: Free screen reader for testing.  
- **VoiceOver (Mac)**: Built-in (`Cmd + F5` to enable).  

## Key Takeaways  
1. **Use semantic HTML** – The foundation of accessibility.  
2. **Test keyboard navigation** – Tab through your UI without a mouse.  
3. **Leverage ARIA sparingly** – Only when native HTML isn’t sufficient.  
4. **Automate checks** – Tools like Axe or Lighthouse catch ~30% of issues.  
5. **Test with real users** – Include people with disabilities in usability testing.  

Accessibility is iterative—audit, fix, and retest regularly.