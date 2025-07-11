# Captchas
CAPTCHA solving is one of Steel's advanced capabilities that helps AI agents and automation tools navigate the modern web more effectively. This document explains how our CAPTCHA solving system works, what types of CAPTCHAs we support, and best practices for implementation.

### How Steel Handles CAPTCHAs
Steel takes a two-pronged approach to dealing with CAPTCHAs:

1. **Prevention First:** Our sophisticated browser fingerprinting and anti-detection systems often prevent CAPTCHAs from appearing in the first place. We maintain realistic browser profiles that make your automated sessions appear more human-like, reducing the likelihood of triggering CAPTCHA challenges.

2. **Automatic Solving:** When CAPTCHAs do appear, our automatic solving system kicks in to handle them transparently, allowing your automation to continue without interruption.

### Supported CAPTCHA Types
Currently, Steel's auto-solver supports these CAPTCHA services:

✅ **Currently Supported:**

- ReCAPTCHA v2 / v3

- HCaptcha

- Cloudflare Turnstile

- ImageToText CAPTCHAs

- Amazon AWS WAF

🔜 **Coming Soon:**

- GeeTest v3/v4

❌ **Not Currently Supported:**

- Custom implementation CAPTCHAs

- Enterprise-specific CAPTCHA systems

- FunCAPTCHA

- Other specialized CAPTCHA types

### How CAPTCHA Solving Works
When you enable CAPTCHA solving in your Steel session, here's what happens behind the scenes:

1. **Detection:** Our system continuously monitors the page for CAPTCHA elements using multiple detection methods:
    1. DOM structure analysis
    2. Known CAPTCHA iframe patterns
    3. Common CAPTCHA API endpoints
    4. Visual element detection

2. **Classification:** Once detected, the system identifies the specific type of CAPTCHA and routes it to the appropriate solver.

3. **Solving:** The CAPTCHA is solved using a combination of:
    1. Machine learning models
    2. Third-party solving services
    3. Browser automation techniques
    4. Token manipulation (when applicable)

4. **Verification:** The system verifies that the CAPTCHA was successfully solved before allowing the session to continue.

### Best Practices for Implementation
1. **Enable CAPTCHA Solving**
    ```python
    # Python
    session = client.sessions.create(
        solve_captcha=True  # Enable CAPTCHA solving
    )
    ```

    ```typescript
    // Node.js
    const session = await client.sessions.create({
        solveCaptcha: true  // Enable CAPTCHA solving
    });
    ```

2. **Implement Proper Waiting**
    When navigating to pages that might contain CAPTCHAs, it's important to implement proper waiting strategies:

    ```python
    # Python example using Playwright
    await page.wait_for_load_state('networkidle')  # Wait for network activity to settle
    await page.wait_for_timeout(2000)  # Additional safety buffer
    ```

    ```typescript
    // Node.js example using Puppeteer
    await page.waitForNetworkIdle();  // Wait for network activity to settle
    await page.waitForTimeout(2000);  // Additional safety buffer
    ```

3. **Detecting CAPTCHA Presence**
    You can detect CAPTCHA presence using these selectors:

    ```typescript
    // Common CAPTCHA selectors
    const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]',
        '.h-captcha',
        '#captcha-box',
        '[class*="captcha"]'
    ];
    ```

### Important Considerations
1. **Plan Availability:** CAPTCHA solving is only available on Developer, Startup, and Enterprise plans. It is not included in the free tier.

2. **Success Rates:** While our system has high success rates, CAPTCHA solving is not guaranteed to work 100% of the time. Always implement proper error handling.

3. **Timing:** CAPTCHA solving can add latency to your automation. Account for this in your timeouts and waiting strategies.

4. **Rate Limits:** Even with successful CAPTCHA solving, respect the target site's rate limits and terms of service.

### Common Issues and Solutions
1. **Timeout Issues**
    1. Increase your session timeout when working with CAPTCHA-heavy sites
    2. Implement exponential backoff for retries

2. **Detection Issues**
    1. Use Steel's built-in stealth profiles
    2. Implement natural delays between actions
    3. Rotate IP addresses using Steel's proxy features

3. **Solving Failures**
    1. Implement proper error handling
    2. Have fallback strategies ready
    3. Consider implementing manual solving as a last resort

### Best Practices for Avoiding CAPTCHAs
1. **Use Steel's Fingerprinting:** Our automatic fingerprinting often helps bypass avoidable CAPTCHAs entirely by making your sessions appear more human-like.

2. **Session Management:**
    1. Reuse successful sessions when possible
    2. Maintain cookies and session data
    3. Use Steel's session persistence features

3. **Request Patterns:**
    1. Implement natural delays between actions
    2. Vary your request patterns
    3. Avoid rapid, repetitive actions

### Looking Forward
Steel is continuously improving its CAPTCHA handling capabilities. We regularly update our solving mechanisms to handle new CAPTCHA variants and improve success rates for existing ones.

Stay updated with our documentation for the latest information about supported CAPTCHA types and best practices.