---
---
<script>
var url_string = window.location.href;
var url = new URL(url_string);
var c = url.searchParams.get("amount");
console.log(c);
</script>

# Payment options

<div id="mobile">
  <p>Click <a href="upi://pay?pa=orthosam@icici&pn=Samuel%20Manoj%20Ch">this link</a> from a mobile device to pay directly ( you should already have a UPI app like BHIM/ GooglePay/ Paytm installed on your device).</p>
</div>

<div id="web"><p>Or scan QR code from any UPI app to pay -

<img src= "https://drive.google.com/uc?id=18BBMEjLRE4oPLORlc51o9oepmsvpFskb"></p></div>

<div id="paypal"><p>And for those of you still using cards--</p>

<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="5YNGF879W6MUA">
<input type="image" src="https://www.paypalobjects.com/en_GB/i/btn/btn_paynowCC_LG.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online!">
<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">
</form></div>
