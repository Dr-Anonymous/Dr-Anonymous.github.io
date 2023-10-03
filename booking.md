---
layout: iframe
title: 
description: Appointment booking
---

<p></p>

<iframe id= 'myFrame' src="" frameborder="0" allowfullscreen></iframe>

<script>
var docId = urlParam() || "1";

if (docId == "2"){
$(document).attr("title", "Dr Shalima Pinnamaneni");
$('#project_title').text("Dr Shalima Pinnamaneni");
$('p').html("Book appointment with <a href='https://orthosam.com/shalima/#about'>Dr Shalima Pinnamaneni</a> <small>M.D General Medicine</small> :");
$('#myFrame').attr('src', 'https://script.google.com/macros/s/AKfycbzn37Ftwqhb8UlFlv2xiOuEAWZoVLdJjhE_QhbOnwfXExUp32pi_zVAB0UhLyYLZZpF/exec');
} else {
$(document).attr("title", "Dr Samuel Manoj");
$('#project_title').text("Dr Samuel Manoj Ch");
$('p').html("Book appointment with <a href='https://orthosam.com/samuel/#about'>Dr Samuel Manoj Ch</a> <small>M.S Orthopaedics(Manipal)</small> :");
$('#myFrame').attr('src','https://script.google.com/macros/s/AKfycby0gj-pDf2IK0KDutU0JCP1-DXqrDUl2iFHPT4A0Ha50w4YwVYfv6RAf2Ydab-33U2rjQ/exec');
}
function urlParam(){
var url = new URL(window.location.href);
var param = url.searchParams.toString().slice(0, -1);
return param;
}
</script>
