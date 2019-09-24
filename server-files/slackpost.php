<?php
/**
 * Chrome extension does not use this file. 
 * This file needs to be in a remote cloud location for Chrome Extension to access.
 */

header("Access-Control-Allow-Origin: *");
print_r($_POST['image_data']);
$datetime = date("Y-m-d h:i:s");
$timestamp = strtotime($datetime);

$file_number_prefix = isset($_POST['file_name']) ? $_POST['file_name'] : '001';
$timestamp = $file_number_prefix . 'slackimage';

$image = $_POST['image_data'];
$imgdata = base64_decode($image);
$f = finfo_open();
$mime_type = finfo_buffer($f, $imgdata, FILEINFO_MIME_TYPE);
$temp=explode('/',$mime_type);
$path = "$timestamp.$temp[1]";
file_put_contents($path,base64_decode($image));
echo "Successfully Uploaded->>> $timestamp.$temp[1]";