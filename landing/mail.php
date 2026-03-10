<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Niedozwolona metoda.',
    ]);
    exit;
}

$leadType = trim((string)($_POST['lead_type'] ?? 'kontakt'));
$fullName = trim((string)($_POST['full_name'] ?? ''));
$companyName = trim((string)($_POST['company_name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$consent = isset($_POST['consent']);

if ($fullName === '' || $companyName === '' || $phone === '' || $email === '' || $message === '' || !$consent) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Uzupelnij wszystkie wymagane pola.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Podaj poprawny adres e-mail.',
    ]);
    exit;
}

$to = 'kontakt@ardrop.pl';
$subject = $leadType === 'partner' ? 'Nowe zgloszenie partnerskie - Ardrop' : 'Nowe zgloszenie kontaktowe - Ardrop';

$safeFullName = htmlspecialchars($fullName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeCompanyName = htmlspecialchars($companyName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safePhone = htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeType = htmlspecialchars($leadType, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

$body = "
<html>
<body>
  <h2>Nowe zgloszenie z formularza kontaktowego</h2>
  <p><strong>Typ zgloszenia:</strong> {$safeType}</p>
  <p><strong>Imie i nazwisko:</strong> {$safeFullName}</p>
  <p><strong>Nazwa firmy:</strong> {$safeCompanyName}</p>
  <p><strong>Telefon:</strong> {$safePhone}</p>
  <p><strong>E-mail:</strong> {$safeEmail}</p>
  <p><strong>Wiadomosc:</strong><br>{$safeMessage}</p>
</body>
</html>
";

$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: Ardrop Landing <no-reply@ardrop.pl>',
    'Reply-To: ' . $email,
];

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Nie udalo sie wyslac wiadomosci.',
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Formularz wyslany.',
]);
