<?php
require('libs/fpdf.php');

// Petite fonction pour remplacer l'ancienne "utf8_decode"
// Elle permet d'afficher correctement les accents (é, à, è...)
function decode($str) {
    return iconv('UTF-8', 'windows-1252', $str);
}

class MedicalPDF extends FPDF {
    function Header() {
        // Logo
        if(file_exists('assets/logo (2).png')) {
            $this->Image('assets/logo (2).png', 10, 10, 40);
        }
        
        $this->SetFont('Arial', 'B', 16);
        // On utilise notre nouvelle fonction decode() partout où il y a du texte
        $this->Cell(0, 10, decode('Cabinet Médical Dr. IA'), 0, 1, 'C');
        
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 5, decode('Médecine Générale - Intelligence Artificielle'), 0, 1, 'C');
        
        $this->Ln(15);
        $this->SetDrawColor(0, 80, 180);
        $this->SetLineWidth(1);
        $this->Line(10, 45, 200, 45);
        $this->Ln(10);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, decode('Page ' . $this->PageNo()), 0, 0, 'C');
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $titre = $_POST['doc_title'] ?? 'DOCUMENT';
    $contenu = $_POST['doc_content'] ?? '';

    // Archive le document dans l'historique (sans bloquer le PDF si la base est indisponible)
    if (trim($contenu) !== '') {
        define('DB_SOFT_FAIL', true);
        require_once __DIR__ . '/db.php';
        if ($pdo) {
            try {
                $check = $pdo->prepare("SELECT COUNT(*) FROM documents WHERE titre = ? AND contenu = ?");
                $check->execute([$titre, $contenu]);
                if ((int) $check->fetchColumn() === 0) {
                    $stmt = $pdo->prepare("INSERT INTO documents (titre, contenu, date_creation) VALUES (?, ?, ?)");
                    $stmt->execute([$titre, $contenu, date('Y-m-d H:i:s')]);
                }
            } catch (Exception $e) {
                error_log('MedVox history error: ' . $e->getMessage());
            }
        }
    }

    $pdf = new MedicalPDF();
    $pdf->AddPage();
    
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 10, decode('Fait le ' . date('d/m/Y')), 0, 1, 'R');
    $pdf->Ln(5);

    $pdf->SetFont('Arial', 'B', 18);
    $pdf->SetTextColor(0, 80, 180);
    $pdf->Cell(0, 10, decode(strtoupper($titre)), 0, 1, 'C');
    $pdf->Ln(10);

    $pdf->SetFont('Arial', '', 12);
    $pdf->SetTextColor(0);
    $pdf->MultiCell(0, 8, decode($contenu));

    $pdf->Ln(20);
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(0, 10, decode('Signature :'), 0, 1, 'R');

    $pdf->Output('I', 'Document_Medical.pdf');
} else {
    echo "Erreur : Utilisez le formulaire pour générer le PDF.";
}
?>