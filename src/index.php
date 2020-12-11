<?php
require_once 'login/users/init.php';
 
// Permission levels
// 1: user-bbp
// 2: administrator
// 3: intern-bbp
// 4. admin-bbp
// 5: tku-bbp

// Language
$l = "de-DE";
require_once "php/language.php";

// Get Breitband configuration
$breitbandconfig_string = file_get_contents("breitbandconfig/breitbandconfig.json");
$breitbandconfig_array = json_decode($breitbandconfig_string, true);
$db = DB::getInstance();

// Check url
if (isset($_GET['register']) && isset($_GET['code']) && isset($_GET['email'])) {
    // Check if the url is the link to validate a registration
    $code = $_GET['code'];
    $email = base64_decode($_GET['email']);
    $verify_account = false;
    $username = '';
    $db->query("SELECT id, username FROM users WHERE email = ? AND vericode = ? AND email_verified = 0", [$email, $code]);
    if ($db->results(true) [0]["id"]) {
        $id = $db->results(true) [0]["id"];
        $username = $db->results(true) [0]["username"];
        $db->query("UPDATE users SET email_verified = 1 WHERE email = ? AND vericode = ?", [$email, $code]);
        $verify_account = true;
        include "php/update-reports-after-registration.php";
        update_reports($email);
    }
    $url = strtok($_SERVER["REQUEST_URI"], "?");
    if ($verify_account) {
        $from = "verification@breitband.berlin.de";
        $to = "breitband@berlin.de";
        $subject = "Berliner Breitband Portal: Neuregistrierung";
        $headers = 'From: ' . $from . "\r\n" . 'Reply-To: ' . $from . "\r\n" . "Content-Type: text/html; charset=utf-8\r\n";
        $message = "Benutzername: " . $username . "<br><br>" . "E-Mail: " . $email;
        mail($to, $subject, $message, $headers);
        $url.= "#account-verified";
    } else {
        $url.= "#email-not-verified";
    }
    header("Location: " . $url);
} elseif (isset($_GET['changemail']) && isset($_GET['code']) && isset($_GET['email'])) {
    // Check if the url is the link to validate a registration
    $code = $_GET['code'];
    $email = base64_decode($_GET['email']);
    $verify_email = false;
    $db->query("SELECT username, id, vericode_expiry FROM users WHERE email_new = ? AND vericode = ?", [$email, $code]);
    if ($db->results(true) [0]["username"] && $db->results(true) [0]["id"] && (strtotime($db->results(true) [0]["vericode_expiry"]) - strtotime(date("Y-m-d H:i:s")) > 0)) {
        $id = $db->results(true) [0]["id"];
        $username_mysql_postgres = $db->results(true) [0]["username"];
        $db->query("UPDATE users SET email = ? WHERE id = ? AND vericode = ? AND email_new = ?", [$email, $id, $code, $email]);
        $db->query("UPDATE users SET email_new = null WHERE id = ? AND vericode = ? AND email = ?", [$id, $code, $email]);
        $verify_email = true;
        //          include "php/update-reports-after-registration.php";
        //          update_reports($email);
        // PostgreSQL
        $postgres_config = include ('php/db_connection.php');
        $postgres_host = $postgres_config['host'];
        $postgres_port = $postgres_config['port'];
        $postgres_dbname = $postgres_config['dbname'];
        $postgres_user = $postgres_config['user'];
        $postgres_password = $postgres_config['password'];
        $dbconn = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die('Error');
        $query_profile = "UPDATE bedarfsmeldungen SET email = $1 WHERE username = $2;" or die();
        $params_profile = array($email, $username_mysql_postgres);
        $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
        pg_free_result($result_profile);
        pg_close($dbconn);
    }
    $url = strtok($_SERVER["REQUEST_URI"], "?");
    if ($verify_email) {
        $url.= "#email-verified";
    } else {
        $url.= "#email-not-verified";
    }
    header("Location: " . $url);
} elseif (isset($_GET['uuid']) && isset($_GET['email']) && isset($_GET['report'])) {
    // Check if the url is the link to validate email for an already saved report
    // PostgreSQL (reports)
    $postgres_config = include ('php/db_connection.php');
    $postgres_host = $postgres_config['host'];
    $postgres_port = $postgres_config['port'];
    $postgres_dbname = $postgres_config['dbname'];
    $postgres_user = $postgres_config['user'];
    $postgres_password = $postgres_config['password'];
    $uuid = $_GET['uuid'];
    $email = base64_decode($_GET['email']);
    // Connect to PostgreSQL
    $dbconn = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die('Error');
    // Prepare query
    $query = "SELECT gid FROM bedarfsmeldungen WHERE email = $1 AND uuid = $2 AND verifiziert = false;" or die("Error");
    // Query parameters
    $params = array($email, $uuid);
    $result = pg_query_params($dbconn, $query, $params) or die($db_error);
    $verify_report = false;
    while ($line = pg_fetch_array($result, null, PGSQL_ASSOC)) {
        $gid = $line["gid"];
        $query_verify_report = "UPDATE bedarfsmeldungen SET verifiziert = true WHERE gid = CAST ($1 AS INTEGER);";
        $params_verify_report = array($gid);
        $result_verify_report = pg_query_params($dbconn, $query_verify_report, $params_verify_report) or die("Error");
        $verify_report = true;
        pg_free_result($result_verify_report);

        // Query get Bezirk
        $query_get_bezirk = "SELECT bezirk FROM bedarfsmeldungen WHERE gid = CAST ($1 AS INTEGER);";
        $params_get_bezirk = array($gid);
        $result_get_bezirk = pg_query_params($dbconn, $query_get_bezirk, $params_get_bezirk) or die("Error");
        $bezirk = "";
        while ($line_get_bezirk = pg_fetch_array($result_get_bezirk, null, PGSQL_ASSOC)) {
            $bezirk = $line_get_bezirk["bezirk"];
        }

        pg_free_result($result_get_bezirk);
        // Query counter
        $query_counter = "UPDATE bedarfsmeldungen_counter SET counter = counter + 1 WHERE bezirk = $1;";
        $query_counter_params = array($bezirk);
        // Query counter sum
        $query_counter_sum = "UPDATE bedarfsmeldungen_counter SET counter = counter + 1 WHERE bezirk = 'summe';";
        $query_counter_sum_params = array();
        // Connect to PostgreSQL
        $dbconn_counter = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die($db_error);
        $result_counter = pg_query_params($dbconn, $query_counter, $query_counter_params) or die($db_error. pg_last_error());
        $result_counter_sum = pg_query_params($dbconn, $query_counter_sum, $query_counter_sum_params) or die($db_error. pg_last_error());
        // Free resultset
        pg_free_result($result_counter);
        pg_free_result($result_counter_sum);
    }
    // Free resultset
    pg_free_result($result);
    // Closing connection
    pg_close($dbconn);
    $url = strtok($_SERVER["REQUEST_URI"], "?");
    if ($verify_report) {
        // Send "thank you" Email
         // Send email
        $from = "verification@breitband.berlin.de";
        $subject = "Berliner Breitband Portal";
        $headers = 'From: ' . $from . "\r\n" . 'Reply-To: ' . $from
        . "\r\n" . "Content-Type: text/html; charset=utf-8\r\n";
        $email_base64_encode = base64_encode($email);
        $message = "Vielen Dank für die Meldung Ihres Bedarfes! Diese Information ist sehr wichtig und unterstützt den Breitbandausbau in Berlin. In einem halben Jahr erhalten Sie eine neue E-Mail, in der wir Ihnen die Möglichkeit geben, den Bedarf für ein weiteres halbes Jahr zu bestätigen. Haben Sie keinen Bedarf mehr oder möchten die Meldung nicht mehr bestätigen, müssen Sie nicht weiter handeln. Wir würden uns freuen, wenn Sie das Portal unterstützten und weitere Freunde/Bekannte dazu ermutigen, deren Bedarfe zu melden.<br>Hierfür haben wir Ihnen einen kleinen Text vorbereitet:<br><br><i>Hallo! Ich habe auf dem Berliner Breitband Portal meinen Breitbandbedarf gemeldet und denke, dass das für Sie/Dich auch interessant ist. Auf <a href='https://breitband.berlin.de'>https://breitband.berlin.de</a> kann der Bedarf eingetragen werden.<br>Viele Grüße<i/>";

        mail($email, $subject, $message, $headers);


        $url.= "#single-report-saved";
    } else {
        $url.= "#email-not-verified";
    }
    header("Location: " . $url);
} elseif (isset($_GET['donotdelete']) && isset($_GET['uuid']) && isset($_GET['email'])) {
    // Check if the url is the link to validate a report after 6 months
    $uuid = $_GET['uuid'];
    $email = base64_decode($_GET['email']);

    // PostgreSQL
    $postgres_config = include ('php/db_connection.php');
    $postgres_host = $postgres_config['host'];
    $postgres_port = $postgres_config['port'];
    $postgres_dbname = $postgres_config['dbname'];
    $postgres_user = $postgres_config['user'];
    $postgres_password = $postgres_config['password'];
    $dbconn_validate_months = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die('Error');
    $query_validate_months = "UPDATE bedarfsmeldungen SET bearbeitet = NOW(), verification_id = NULL, verification_id_sent = false WHERE verification_id = $1 AND email = $2 RETURNING *;" or die();
    $params_validate_months = array($uuid, $email);
    $result_validate_months = pg_query_params($dbconn_validate_months, $query_validate_months, $params_validate_months) or die($db_error);

    $changed_report = false;
    while ($line_validate_months = pg_fetch_array($result_validate_months, null, PGSQL_ASSOC)) {
       $changed_report = true;
    }

    pg_free_result($result_validate_months);
    pg_close($dbconn_validate_months);

    $url = strtok($_SERVER["REQUEST_URI"], "?");

    if ($changed_report) {
//        $dbconn_delete_uuid = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die('Error');
//        $query_delete_uuid = "UPDATE bedarfsmeldungen SET verification_id = NULL WHERE verification_id = $1 AND email = $2;" or die();
//        $params_delete_uuid = array($uuid, $email);
//        $result_delete_uuid = pg_query_params($dbconn_delete_uuid, $query_delete_uuid, $params_delete_uuid) or die($db_error);

         $url.= "#report-verify-after-months";
    } else {
        $url.= "#report-not-verify-after-months";
    }
    header("Location: " . $url);
}

$webpack_manifest = file_get_contents("./manifest.json");
$files = json_decode($webpack_manifest, true);

?>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="de" lang="de">
    <head>
        <title>Berliner Breitband Portal</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8">
        <?php
echo "<link rel='stylesheet' href='" . $files["app.css"] . "'>";
?>
        <link rel="shortcut icon" href="img/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="img/apple-touch-icon.png" type="image/png" />
    </head>
    <body class="locale_de" cz-shortcut-listen="true">
        <div class="container-wrapper container-portal-header">
            <div class="container">
                <div class="row">
                    <div class="span12">
                        <!-- NAVIGATION BEGIN: portal -->
                        <div class="html5-header portal-header hidden-phone">
                            <div class="red-line"></div>
                            <div class="html5-figure main-image">
                                <a href="https://www.berlin.de/" target="_blank">
                                <img class="portal-logo hide-mobile" src="img/berlin_de.png" alt="Zur Homepage von Berlin.de" />
                                </a>
                            </div>
                            <!-- /html5-figure -->
                            <p class="navSkip hidden-phone osvnp">Navigiere direkt zu:</p>
                            <ul class="navSkip hidden-phone">
                                <li><a href="#aural_institutionssuche">Suche</a></li>
                                <li><a href="#aural_maincontent">Inhalt</a></li>
                            </ul>
                            <nav aria-label="Portal Navigation">
                                <h6 class="aural">Portal Navigation</h6>
                                <p class="aural" id="bo-portalnavilinkslabel">Besuchen Sie auch unsere anderen Themen-Bereiche:</p>
                                <ul class="portal-navi" id="bo-portalnavilinks" aria-labelledby="bo-portalnavilinkslabel">
                                    <li class="active"><a href="https://www.berlin.de/politik-verwaltung-buerger/" target="_blank">Politik, Verwaltung, B&#252;rger</a></li>
                                    <li><a href="https://www.berlin.de/kultur-und-tickets/" target="_blank">Kultur &#38; Ausgehen</a></li>
                                    <li><a href="https://www.berlin.de/tourismus/" target="_blank">Tourismus</a></li>
                                    <li><a href="https://www.berlin.de/wirtschaft/" target="_blank">Wirtschaft</a></li>
                                    <li><a href="https://www.berlin.de/special/" target="_blank">Lifestyle</a></li>
                                    <li><a href="https://www.berlin.de/adressen/" target="_blank">BerlinFinder</a></li>
                                    <li><a href="https://www.berlin.de/stadtplan/" target="_blank">Stadtplan</a></li>
                                </ul>
                            </nav>
                            <!-- /html5-nav -->
                        </div>
                        <!-- /html5-header -->
                        <!-- NAVIGATION END: portal -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete account modal -->
        <div id="modal-delete-account" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                        <h3 class="modal-title">Konto löschen</h3>
                    </div>
                    <div class="modal-body">
                        <i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;Ihr Konto <b><?php echo $user->data()->username; ?></b> samt allen Bedarfsmeldungen wird endgültig gelöscht!
                    </div>
                    <div class="modal-footer">
                        <button id="modal-delete-account-confirm" type="button" class="btn btn-secondary" data-dismiss="modal">Löschen</button>
                        <button id="modal-delete-account-close" type="button" class="btn btn-secondary" data-dismiss="modal">Abbrechen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete account failed modal -->
        <div id="modal-delete-account-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                        <h3 class="modal-title">Konto löschen</h3>
                    </div>
                    <div class="modal-body">
                        <i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;Ihr Konto <b><?php echo $user->data()->username; ?></b> konnte <b>NICHT</b> gelöscht werden. Bitte wenden Sie sich an den Administrator.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-delete-account-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Allow contact modal -->
        <div id="modal-allow-contact" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                        <h3 class="modal-title"><?php echo language("MODAL_CONTACT_TITLE"); ?></h3>
                    </div>
                    <div class="modal-body">
                        <?php echo language("MODAL_CONTACT_BODY"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-allow-contact-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data protection modal -->
        <div id="modal-data-protection" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                    </div>
                    <div class="modal-footer">
                        <button id="modal-data-protection-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report saved (not logged-in , single) -->
        <div id="modal-not-logged-report" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("REPORT_SAVED_NOT_LOGGED_IN_BODY"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-not-logged-report-close" type="button" class="btn btn-secondary" data-dismiss="modal"><?php echo language("REPORT_BUTTON_BACK_TO_MAP"); ?></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report saved (logged-in , single) -->
        <div id="modal-logged-single-report" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("MESSAGE_SINGLE_REPORT_SAVED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-logged-single-report-close" type="button" class="btn btn-secondary" data-dismiss="modal"><?php echo language("REPORT_BUTTON_BACK_TO_MAP"); ?></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report saved (logged-in , multiple) -->
        <div id="modal-logged-multiple-report" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("MESSAGE_SINGLE_REPORT_SAVED"); ?>
                        <div class="text-center">
                            <span id="modal-logged-multiple-report-more" class="label-like-url"><?php echo language("REPORT_BUTTON_MORE_REPORTS"); ?></span>
                            <br>
                            <?php echo language("REPORT_MORE_REPORTS_INFO"); ?>
                        </div>
                        <br>
                        <div class="text-center">
                            <span id="modal-logged-multiple-report-new" class="label-like-url"><?php echo language("REPORT_BUTTON_NEW_REPORT"); ?></span>
                         </div>
                         <br>
                         <div class="text-center">
                            <span id="modal-logged-multiple-report-to-viewer" class="label-like-url"><?php echo language("REPORT_BUTTON_BACK_TO_MAP"); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report not saved - email already used (not logged-in , single) -->
        <div id="modal-report-not-saved-email-used" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("REPORT_NOT_SAVED_EMAIL_USED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-report-not-saved-email-used-close" type="button" class="btn btn-secondary" data-dismiss="modal"><?php echo language("BUTTON_BACK"); ?></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report not saved -->
        <div id="modal-report-not-saved" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("REPORT_NOT_SAVED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-report-not-saved-close" type="button" class="btn btn-secondary" data-dismiss="modal"><?php echo language("BUTTON_BACK"); ?></button>
                    </div>
                </div>
            </div>
        </div>

         <!-- Report deleted -->
        <div id="modal-report-deleted" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("MY_REPORTS_DELETED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-report-deleted-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report deleted -->
        <div id="modal-report-not-deleted" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("MY_REPORTS_NOT_DELETED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-report-not-deleted-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report edited -->
        <div id="modal-report-edited" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        <?php echo language("REPORT_EDITED"); ?>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-report-edited-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <?php
        // Modals for Admins
        if (hasPerm([2, 4])) {
        ?>
        <!-- New company saved -->
        <div id="modal-forum-new-company-saved" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der neue Eintrag wurde gespeichert.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-forum-new-company-saved-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company edited -->
        <div id="modal-forum-company-edited" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag wurde erfolgreich editiert.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-forum-company-edited-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company deleted -->
        <div id="modal-forum-company-deleted" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag wurde gelöscht.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-forum-company-deleted-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company save failed -->
        <div id="modal-forum-company-save-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag konnte nicht gespeichert werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-forum-company-save-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company delete failed -->
        <div id="modal-forum-company-delete-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag konnte nicht gelöscht werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-forum-company-delete-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Video save failed -->
        <div id="modal-video-save-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Das Video konnte nicht gespeichert werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-video-save-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Video delete failed -->
        <div id="modal-video-delete-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Das Video konnte nicht gelöscht werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-video-delete-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Save news failed -->
        <div id="modal-news-save-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag konnte nicht gespeichert werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-news-save-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Save news -->
        <div id="modal-news-saved" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag wurde gespeichert.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-news-saved-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-news-edited" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Die Änderungen wurden gespeichert.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-news-edited-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete news -->
        <div id="modal-news-deleted" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag wurde gelöscht.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-news-deleted-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-news-delete-failed" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body">
                        Der Eintrag konnte nicht gelöscht werden.
                    </div>
                    <div class="modal-footer">
                        <button id="modal-news-delete-failed-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <?php
        }
        ?>

        <!-- Contact -->
        <div id="modal-contact" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                    </div>
                    <div class="modal-body" id="modal-contact-body">

                    </div>
                    <div class="modal-footer">
                        <button id="modal-contact-close" type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ITDZ modal -->
        <div id="modal-itdz" class="modal" tabindex="-1" role="dialog" hidden>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <img src="img/breitband_logo_long.png" alt="Breitband-Kompetenz-Team">
                        </div>
                        <h3 class="modal-title"><?php echo language("MODAL_ITDZ_TITLE"); ?></h3>
                    </div>
                    <div class="modal-body">
                        <p><?php echo language("MODAL_ITDZ_BODY"); ?></p>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-itdz-close" type="button" class="btn btn-secondary" data-dismiss="modal">Abbrechen</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- navi mobil header inc -->
        <div class="sticky-header hidden-desktop hidden-tablet bde-gradient">
            <div class="red-line"></div>
            <div class="portal-logo">
                <a title="Link f&#252;hrt zur Startseite von Berlin.de" href="https://www.berlin.de" target="_blank">
                <img title="Link f&#252;hrt zur Startseite von Berlin.de" alt="Bild zeigt: Berlin.de Logo" src="img/berlin_de.png" />
                </a>
            </div>
        </div>
        <!-- navi mobil header inc -->
        <div id="top" class="container-wrapper container-content template-land_overview">
            <div class="container">
                <div class="row">
                    <div class="span12">
                        <!-- NAVIGATION BEGIN: horizontal-->
                        <div class="row">
                            <div class="span12">
                                <!--NAVIGATION BEGIN: meta-->
                                <div class="html5-header content-header ">
                                    <div class="row">
                                        <div class="span5">
                                            <div class="html5-section section-logo without-logo">
                                                <div class="html5-section text">
                                                    <a href="index.php" title='Link zu: Startseite von "Berliner Breitband Portal"'>
                                                        <!-- <span class="institution">Breitband-Kompetenz-Team</span> -->
                                                        <span class="title">Berliner Breitband Portal</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="span7"></div>
                                    </div>
                                </div>
                                <!-- NAVIGATION END: meta-->
                            </div>
                        </div>
                        <div class="row">
                            <div class="span12">
                                <!-- <span class="mobile-blue-line hidden-desktop hidden-tablet"></span> -->
                                <div class="content-navi-wrapper navbar hidden-phone">
                                    <div class="html5-nav content-navi-top navbar-inner">
                                        <nav class="nav-collapse mainnav-collapse collapse" aria-label="Hauptnavigation">
                                            <ul id="bbp-tabs" class="nav nav-tabs" role="tablist">
                                                <li class="nav-item" id="start-tab-button">
                                                    <a class="nav-link active" href="#start" role="tab" data-toggle="tab" aria-controls="start"> <?php echo language("INDEX_START_TITLE"); ?></a>
                                                </li>
                                                <li class="nav-item" id="viewer-tab-button">
                                                    <a class="nav-link" href="#bedarfskarte" role="tab" data-toggle="tab" aria-controls="bedarfskarte"><?php echo language("INDEX_VIEWER_TITLE"); ?></a>
                                                </li>
                                                <li class="nav-item" id="report-tab-button">
                                                    <a class="nav-link" href="#bedarfsmeldung" role="tab" data-toggle="tab" aria-controls="bedarfsmeldung"> <?php echo language("INDEX_REPORT_TITLE"); ?></a>
                                                </li>


                                                <li class="nav-item has-submenu" id="forum-tab-button">
                                                    <a class="nav-link" id="forum-menu" href="#forum" role="tab" data-toggle="tab"><?php echo language("INDEX_FORUM_TITLE"); ?></a>
                                                    <ul class="nav">
                                                        <li class="">
                                                            <a class="nav-link forum-link archive_link" href="#forum-archive" role="tab" data-toggle="tab">Archiv</a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link forum-link provider_link" href="#forum-provider" role="tab" data-toggle="tab">Anbieter</a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link forum-link technology_link" href="#forum-technology" role="tab" data-toggle="tab">Technologien</a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link forum-link supply_link" href="#forum-supply" role="tab" data-toggle="tab">Breitbandversorgung</a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link forum-link infos_link" href="#forum-infos" role="tab" data-toggle="tab">Weitere Informationen</a>
                                                        </li>
                                                         <?php
                                                        // Only for Admins
                                                        if (hasPerm([2, 4])) {
                                                        ?>
                                                        <li class="">
                                                            <a class="nav-link forum-link" href="#forum-ihk" role="tab" data-toggle="tab" id='ihk_link'>IHK</a>
                                                        </li>
                                                        <?php
                                                        }
                                                        ?>
                                                    </ul>
                                                </li>


                                                <li class="nav-item has-submenu" id="help-tab-button">
                                                        <a class="nav-link" id ="forum-hilfe" href="#help" role="tab" data-toggle="tab"><?php echo language("INDEX_HELP_TITLE");?></a>
                                                        <ul class="nav">
                                                            <li class="">
                                                                <a class="nav-link help-link" id='help-link-faq' href="#help-faq" role="tab" data-toggle="tab">FAQ</a>
                                                            </li>
                                                            <li class="">
                                                                <a class="nav-link help-link" id='help-link-glossar' href="#help-glossar" role="tab" data-toggle="tab">Glossar</a>
                                                            </li>
                                                        </ul>
                                                </li>


                                                <li id="single-report-saved-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#single-report-saved" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="email-not-verified-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#email-not-verified" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="account-not-verified-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#account-not-verified" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="account-verified-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#account-verified" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="email-verified-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#email-verified" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="report-verify-after-months-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#report-verify-after-months" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="report-not-verify-after-months-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#report-not-verify-after-months" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="register-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#registrieren" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="forgot-password-sent-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#forgot-password-sent" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="forgot-password-not-sent-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#forgot-password-not-sent" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="reset-password-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#reset-password" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="reset-password-success-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#reset-password-success" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="reset-password-error-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#reset-password-error" role="tab" data-toggle="tab"></a>
                                                </li>
                                                <li id="contact-tab-button" class="nav-item">
                                                    <a class="nav-link" href="#kontakt" role="tab" data-toggle="tab"></a>
                                                </li>

                                                <?php
if (!$user->isLoggedIn()) {
?>
                                                <li class="nav-item" id="login-tab-button">
                                                    <!-- <a class="nav-link" href="login.php" class="btn btn-primary"><?php echo language("INDEX_LOGIN_TITLE"); ?></a> -->
                                                    <a class="nav-link" href="#konto" role="tab" data-toggle="tab"><?php echo language("INDEX_LOGIN_TITLE"); ?></a>
                                                </li>
                                                <?php
} else {
?>
                                                <li class="has-submenu" id="account-tab-button">
                                                    <a class="nav-link" id="profile-logout-menu" href="#"><?php echo language("PROFILE_LOGOUT_TITLE"); ?></a>
                                                    <ul class="nav">
                                                        <li class="">
                                                            <a class="nav-link" href="#profil" role="tab" data-toggle="tab"><?php echo language("PROFILE_TITLE"); ?></a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link" href="#meine-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("MY_REPORTS_TITLE"); ?></a>
                                                        </li>
                                                        <?php
                                                        if (hasPerm([5])) {
                                                        // TKU
                                                        ?>
                                                        <li class="">
                                                            <a class="nav-link" href="#tku-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("TKU_REPORTS_TITLE"); ?></a>
                                                        </li>
                                                        <?php
                                                        }
                                                        ?>
                                                        <?php
                                                        if (hasPerm([2, 4])) {
                                                        // TKU
                                                        ?>
                                                        <li class="">
                                                            <a class="nav-link" href="#admin-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("ADMIN_REPORTS_TITLE"); ?></a>
                                                        </li>
                                                        <?php
                                                        }
                                                        ?>
                                                        <li class="">
                                                            <a class="nav-link" href="#benachrichtigungen" role="tab" data-toggle="tab"><?php echo language("MESSAGES_TITLE"); ?></a>
                                                        </li>
                                                        <li class="">
                                                            <a class="nav-link" href="logout.php" role="tab"><?php echo language("INDEX_LOGOUT_TITLE"); ?></a>
                                                        </li>
                                                    </ul>
                                                </li>



                                                <?php
}
?>                                          
                                                
                                                <?php
                                                        if (hasPerm([2, 4])) {

                                                ?>
                                              
                                                <li class="">
                                                    <a class='nav-link' href='#video-upload' role='tab' data-toggle='tab'>Videos</a>
                                                </li>

                                                <?php 
                                                    }
                                                ?>
                                            </ul>
                                            <div class="beberlin"><img alt="Logo beBerlin" title="beBerlin" src="img/logo_beberlin_darkblue.png" /></div>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--NAVIGATION END: horizontal-->

                        <!-- content home -->
                        <!-- row - span12 -->
                        <!-- Hier den Applikations-Content einfuegen -->
                        <div class="tab-content">
                            <!-- Start page -->
                            <div role="tabpanel" class="tab-pane fade in active" id="start">
                                <div id="startpage-body"></div>
                                <?php
                                if (hasPerm([2, 4])) {
                                       // Only permissions administrator, admin-bbp
                                   ?>
                                   <br>
                                    <button class="btn btn-primary" id="startpage-edit">Editieren</button>
                                    <button class="btn btn-primary" id="startpage-preview">Vorschau</button>
                                    <button class="btn btn-primary" id="startpage-save">Speichern</button>
                                    <button class="btn btn-primary" id="startpage-cancel">Abbrechen</button>
                                    <button class="btn btn-primary" id="startpage-stop-preview">Vorschau beenden</button>
                                   <?php
                                   }
                                   ?>
                                <br>
                                <br>

                                <div id ='startPage-style' >
                                    <div id="startPage-news" class = 'row'>
                                    </div>
                                    <div id="startPage-news-buttons" class = 'row'>
                                    </div>
                                 </div>
                                 <br>
                                 <br>

                                 <div id="startpage-bottom-body"></div>
                                     <?php
                                     if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                         <button class="btn btn-primary" id="startpage-bottom-edit">Editieren</button>
                                         <button class="btn btn-primary" id="startpage-bottom-preview">Vorschau</button>
                                         <button class="btn btn-primary" id="startpage-bottom-save">Speichern</button>
                                         <button class="btn btn-primary" id="startpage-bottom-cancel">Abbrechen</button>
                                         <button class="btn btn-primary" id="startpage-bottom-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>
                                     <br>
                                     <br>
                            </div>

                            <!-- Impressum -->
                            <div role="tabpanel" class="tab-pane fade in" id="impressum">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#impressum" role="tab" data-toggle="tab">Impressum</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">
                                    <div class="span1"></div>
                                    <div class="span10">
                                        <div id="about-body">
                                        </div>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                               // Only permissions administrator, admin-bbp
                                           ?>
                                           <br>
                                            <button class="btn btn-primary" id="about-edit">Editieren</button>
                                            <button class="btn btn-primary" id="about-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="about-save">Speichern</button>
                                            <button class="btn btn-primary" id="about-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="about-stop-preview">Vorschau beenden</button>
                                           <?php
                                           }
                                           ?>
                                    </div>
                                </div>
                            </div>

                            <!-- Datenschutzerklärung -->
                            <div role="tabpanel" class="tab-pane fade in" id="datenschutz">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#datenschutz" role="tab" data-toggle="tab">Datenschutzerklärung</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">
                                    <div class="span1"></div>
                                    <div class="span10">
                                        <div id="datenschutz-body">

                                        </div>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                               // Only permissions administrator, admin-bbp
                                           ?>
                                           <br>
                                            <button class="btn btn-primary" id="datenschutz-edit">Editieren</button>
                                            <button class="btn btn-primary" id="datenschutz-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="datenschutz-save">Speichern</button>
                                            <button class="btn btn-primary" id="datenschutz-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="datenschutz-stop-preview">Vorschau beenden</button>
                                           <?php
                                           }
                                           ?>
                                    </div>
                                </div>
                            </div>

                            <!-- Barrierefreiheit -->
                            <div role="tabpanel" class="tab-pane fade in" id="barrierefreiheit">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#barrierefreiheit" role="tab" data-toggle="tab">Barrierefreiheit</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">

                                    <div class="span1"></div>

                                    <div class="span10">

                                        <div id="barrierefreiheit-body">

                                            <br>
                                            <!-- Erklaerung zur Barrierefreiheit -->
                                            <h1>Erklärung zur digitalen Barrierefreiheit des „Berliner Breitband Portals"</h1>
                                            <h2>Öffentliche Stelle/ Geltungsbereich</h2>
                                            <p>
                                            Die Senatsverwaltung für Wirtschaft, Energie und Betriebe bemüht sich, ihren Webauftritt oder mobile Anwendung barrierefrei zu machen. Die Erklärung zur digitalen Barrierefreiheit wird im Gesetz über die barrierefreie Informations- und Kommunikationstechnik Berlin (BIKTG Bln) verlangt. Die technischen Anforderungen zur Barrierefreiheit ergeben sich aus der BITV 2.0.
                                            </p>
                                            <p>
                                            Diese Erklärung zur digitalen Barrierefreiheit gilt für das Angebot „Berliner Breitband Portal".    
                                            </p>
                                            <h2>Wann wurde die Erklärung zur Barrierefreiheit erstellt?</h2>
                                            <p>
                                            Diese Erklärung wurde am 21.09.2020 erstellt bzw. überarbeitet.    
                                            </p>
                                            <p>
                                            Die technische Überprüfung der Barrierefreiheit wurde durchgeführt von der oben aufgeführten öffentlichen Stelle.   
                                            </p>
                                            <h2>Wie barrierefrei ist das Angebot?</h2>
                                            <p>
                                            Dieser Webauftritt/ Diese Anwendung ist nur teilweise barrierefrei. Es werden nur teilweise die Anforderungen der BITV 2.0 erfüllt.
                                            <h2>Welche Bereiche sind nicht barrierefrei?</h2>
                                            <p>Die nachstehend aufgeführten Bereiche sind aus folgenden Gründen nicht barrierefrei:</p>

                                            <h3>Unvereinbarkeit mit BITV 2.0</h3>
                                            <p>Teilbereiche, die nicht barierefrei sind:</p>
                                            <p style='font-weight:bold'>1. Barriere: Tastaturbedienbarkeit</p>
   
                                                <ul>    
                                                    <li>Beschreibung: Man kann mit der Tabulator-Taste gut durch die Felder manövrieren, wenn man eine Person ist, die aus unterschiedlichen Gründen keine Maus bedienen kann.<br>Allerdings sieht man nur in einem sehr kleinen Feld links unten, wo man sich gerade beim Manövrieren befindet.</li>
                                                    <li>Maßnahmen: Der „Standort“ der Tabulator-Taste wird markiert indem die Standorte als unterstrichene Wörter angezeigt werden.</li>
                                                    <li>Zeitplan: Behebung bis März 2021</li>
                                                    <!-- <li>Barrierefreie Alternative:<br>-</li> --> 
                                                </ul>
                                       
                                            <p style='font-weight:bold'>2. Barriere: Logos </p>
                                      
                                                <ul>
                                                    <li>Beschreibung: Die Partnerlogos des „Berliner Breitband Portals" liegen nur als Bild vor. Dies kann eine Vorlesesoftware für blinde Menschen nicht erfassen.</li>
                                                    <li>Maßnahmen: Unter die Logo-Bilder schreibt die Redaktion den Text: „Partner des „Berliner Breitband Portals" sind ..." </li>
                                                    <li>Zeitplan: Behebung bis März 2021</li>
                                                    <!-- <li>Barrierefreie Alternative:<br>-</li> --> 
                                        </ul>
                                 
                                            <p style='font-weight:bold'>3. Barriere: Sprache</p>

                                                <ul>
                                                    <li>Beschreibung: Menschen mit Einschränkung im Verstehen von Sprache oder deutscher Sprache können einige Texte auf der Webseite ggf. nicht verstehen. Hürden sind zu lange Sätze oder Wörter, Fremdwörter, Fachausdrücke, Passivsätze oder Substantivierungen.</li>
                                                    <li>Maßnahmen: Die Webseiten-Redakteur*innen erstellen zunächst ein Glossar, bei dem Dach- und Fremdwörter erklärt werden.</li>
                                                    <li>Zeitplan: Behebung bis März 2021</li>
                                                    <!-- <li>Barrierefreie Alternative:<br>-</li> --> 
                                        </ul>
                                            
                                            <h2>Wen können Sie bei Anmerkungen oder Fragen zur digitalen Barrierefreiheit (Feedbackoptionen) kontaktieren?</h2>
                                            <p>Kontakt zur Ansprechperson der öffentlichen Stelle:</p>
                                            <p>
                                                Name: Anika Wiest<br>
                                                E-Mail: <a href='mailto:anika.wiest@senweb.berlin.de'>anika.wiest@senweb.berlin.de</a><br>
                                                Telefon: (030)90138423
                                            </p>

                                            <h2>Kontakt zur Landesbeauftragten für digitale Barrierefreiheit</h2>

                                            <p>Wenn Ihre Kontaktaufnahme mit der öffentlichen Stelle nicht erfolgreich war, können Sie sich an die Landesbeauftragte für digitale Barrierefreiheit wenden.</p>
                                            <a href='https://www.berlin.de/moderne-verwaltung/barrierefreie-it/anlaufstellen/landesbeauftragte/formular.989601.php'>Link zum Kontaktformular</a>
                                            <br>
                                            <a href='https://www.berlin.de/moderne-verwaltung/barrierefreie-it/anlaufstellen/landesbeauftragte/artikel.988070.php'>Weitere Informationen zur Landesbeauftragten für digitale Barrierefreiheit</a>
                                        </div>
                                       
                                    </div>
                                </div>
                            </div>

                            <!-- Bedarfskarte -->
                            <div role="tabpanel" class="tab-pane fade in" id="bedarfskarte">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#bedarfskarte" role="tab" data-toggle="tab">Bedarfskarte</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div id="viewer-map"></div>
                                <div id="viewer-popup" class="ol-popup" hidden>
                                    <a href="#" id="viewer-popup-closer" class="ol-popup-closer"></a>
                                    <div id="viewer-popup-content"></div>
                                </div>
                                <div id="viewer-text">

                                <?php
                                if ($user->isLoggedIn()) {
                                    if (hasPerm([2, 4, 5], $user->data()->id)) {
                                        // administrator or admin-bbp or tku-bbp: WoFIS text
                                ?>
                                    <div id="viewer-wofis-text-div">
                                        <p id="viewer-wofis-text-we">*WE = Wohneinheiten</p>
                                        <p>Die dargestellten potentiellen Wohnbauflächen leiten sich aus dem Berliner Wohnbauflächen-Informationssystem (WoFIS) ab. WoFIS wird durch die Senatsverwaltung für Stadtentwicklung und Wohnen betreut und bietet einen Überblick über die potentiellen Wohnbauflächen der Stadt Berlin nach unterschiedlichem Status. Für das Berliner Breitbandportal werden diese Flächen auf die Ebene der lebensweltlich orientierten Räume (LOR) aggregiert. Daraus lassen sich potentielle neue Bedarfsgebiete und Erschließungspotentiale ableiten</p>
                                        <p>Die Zahlen geben die Summe der potentiellen Wohneinheiten innerhalb eines LOR an. Es folgt eine Erläuterung der unterschiedlichen Kategorien:</p>
                                        <table>
                                            <tr>
                                                <th>Attribut</th>
                                                <th>Beschreibung</th>
                                            </tr>
                                            <tr>
                                                <td>Gesamtanzahl WE*</td>
                                                <td>Summe aller WE</td>
                                            </tr>
                                            <tr>
                                                <td>Bereits realisierte WE</td>
                                                <td>Bereits realisierte WE	Summe der seit ca. 2014/2015 realisierten WE</td>
                                            </tr>
                                            <tr>
                                                <td>In Bau befindliche WE</td>
                                                <td>Summer der aktuell in der Umsetzung befindlichen WE</td>
                                            </tr>
                                            <tr>
                                                <td>Kurzfristig umsetzbare WE</td>
                                                <td>Realisierung binnen 3 Jahren möglich</td>
                                            </tr>
                                            <tr>
                                                <td>Mittelfristig umsetzbare WE</td>
                                                <td>Realisierung binnen 7 Jahren möglich</td
                                            </tr>
                                            <tr>
                                                <td>Langfristig umsetzbare WE</td>
                                                <td>Realisierung binnen 12 Jahren möglich</td>
                                            </tr>
                                        </table>
                                        <p>Die Gesamtsumme kann in einzelnen LOR eine Differenz aufweisen, die mit möglichen Potenzialen begründet werden kann. Diese sind in der LOR-Darstellung nicht mit aufgeführt.</p>
                                    </div>
                                <?php
                                    }
                                }
                                ?>

                                <div id="viewer-message-area-body"></div>
                                     <?php
                                     if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                         <button class="btn btn-primary" id="viewer-message-area-edit">Editieren</button>
                                         <button class="btn btn-primary" id="viewer-message-area-preview">Vorschau</button>
                                         <button class="btn btn-primary" id="viewer-message-area-save">Speichern</button>
                                         <button class="btn btn-primary" id="viewer-message-area-cancel">Abbrechen</button>
                                         <button class="btn btn-primary" id="viewer-message-area-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>

                                    <div id="viewer-statistics-div">
                                        <span id="viewer-statistics-title" class="statistics-closed"><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;<?php echo language("VIEWER_STATISTICS_TITLE"); ?></span>
                                        <div id="viewer-statistics-content">
                                            <br>
                                            <div id="viewer-statistics-note">
                                                <p><?php echo language("VIEWER_STATISTICS_NOTE"); ?></p>
                                            </div>
                                            <div id="viewer-statistics-table"></div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <!-- Bedarfsmeldung -->
                            <div role="tabpanel" class="tab-pane fade in" id="bedarfsmeldung" aria-labelledby="report-tab-button">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#bedarfsmeldung" role="tab" data-toggle="tab">Bedarfsmeldung</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div id="report-menu-row" class="row">
                                    <div class="span2"></div>
                                    <div class="span8 column-content">

                                        <div id="bedarfsmeldungen-text-body"></div>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                         <button class="btn btn-primary" id="bedarfsmeldungen-text-edit">Editieren</button>
                                         <button class="btn btn-primary" id="bedarfsmeldungen-text-preview">Vorschau</button>
                                         <button class="btn btn-primary" id="bedarfsmeldungen-text-save">Speichern</button>
                                         <button class="btn btn-primary" id="bedarfsmeldungen-text-cancel">Abbrechen</button>
                                         <button class="btn btn-primary" id="bedarfsmeldungen-text-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>
                                        <div class="section_splitter"></div>

                                        <h2 class="title">Einzelbedarfsmeldung</h2>
                                        <p>
                                            <?php echo language("REPORT_MENU_SINGLE_MESSAGE"); ?>
                                        </p>
                                        <div>
                                            &nbsp;<button id="report-single-button" class="btn btn-primary pull-right"><?php echo language("REPORT_MENU_SINGLE_BUTTON"); ?></button>
                                        </div>
                                        <br>

                                        <div class="section_splitter"></div>

                                        <h2 class="title">Erweiterte Bedarfsmeldung</h2>
                                        <p>
                                            <?php echo language("REPORT_MENU_MULTIPLE_MESSAGE1"); ?>
                                        </p>

                                        <?php
                                            if ($user->isLoggedIn()) {
                                                echo '<div>&nbsp;<button id="report-multiple-button" class="btn btn-primary pull-right">' . language("REPORT_MENU_MULTIPLE_BUTTON") . '</button></div><br>';
                                            } else {
                                                echo language("REPORT_MENU_MULTIPLE_MESSAGE2");
                                                echo '<div>&nbsp;<button id="report-multiple-button" class="btn btn-primary pull-right disabled">' . language("REPORT_MENU_MULTIPLE_BUTTON") . '</button></div><br>';
                                            }
                                        ?>

                                    </div>
                                </div>

                                <div id="report-first-row" class="row">
                                    <h2 id="report-edit-title" hidden>Bedarfsmeldung bearbeiten</h2>
                                    <div id="report-page1" class="span5">
                                        <div id="report-tools">
                                            <form>
                                                <input type="hidden" id="report-edit-id" value="0">

                                                <div class="form-category"><?php echo language("REPORT_BROADBAND_TITLE"); ?></div>
                                                <div class="form-group">
                                                    <label for="report-use"><?php echo language("REPORT_BROADBAND_USE"); ?>*</label>
                                                    <select id="report-use" class="form-control"></select>
                                                </div>
                                                <div class="form-group">
                                                    <label for="report-speed"><?php echo language("REPORT_BROADBAND_SPEED"); ?>*</label>
                                                    <select id="report-speed" class="form-control"></select>
                                                </div>

                                                <div class="form-group">

                                                    <label for="report-symmetry" id="report-symmetry-label"><span id="report-symmetry-label-span"><?php echo language("REPORT_BROADBAND_SYMMETRY"); ?>&nbsp;&nbsp;<span id="report-symmetry-label-icon" class="fa fa-info-circle"></span></span><span id="tooltip-summetry"><?php echo language("REPORT_BROADBAND_SYMMETRY_TOOLTIP"); ?></span></label>
                                                    <select id="report-symmetry" class="form-control"></select>
                                                </div>


                                                <div class="form-group">
                                                    <label for="report-price"><?php echo language("REPORT_BROADBAND_PRICE"); ?>*</label>
                                                    <select id="report-price" class="form-control">  
                                                    </select>
                                                </div>

                                                <div class="form-category smaller-bottom-margin"><?php echo language("REPORT_ADDRESS_TITLE"); ?></div>
                                                <p class="smaller-fonts"><?php echo language("REPORT_ADDRESS_INFOS"); ?></p>
                                                <div id="report-street-div" class="form-group selectpickerdiv">
                                                    <label for="report-street"><?php echo language("REPORT_STREET"); ?>*</label>
                                                    <input id="report-street" type="text" class="form-control" placeholder="<?php echo language("REPORT_ENTER_STREET"); ?>">
                                                </div>
                                                <br><br>
                                                <div id="report-housenumber-div" class="form-group selectpickerdiv">
                                                    <label for="report-housenumber"><?php echo language("REPORT_HOUSE_NUMBER"); ?>*</label>
                                                    <select id="report-housenumber" class="form-control" data-live-search="true" disabled>
                                                        <option selected></option>
                                                    </select>
                                                </div>
                                                <div id="report-postcode-div" class="form-group selectpickerdiv">
                                                    <label for="report-postcode"><?php echo language("REPORT_POSTCODE"); ?>*</label>
                                                    <input id="report-postcode" type="text" class="form-control" disabled>
                                                </div>

                                                <?php
                                                    if (!$user->isLoggedIn()) {
                                                ?>
                                                    <br><br>
                                                    <div id="report-email-div" class="form-group">
                                                        <label for="report-email"><?php echo language("REPORT_EMAIL_TITLE"); ?>*</label>
                                                        <input type="email" class="form-control" id="report-email" placeholder="<?php echo language("REPORT_ENTER_EMAIL"); ?>" required>
                                                    </div>
                                                    <div id="report-validate-email-div" class="form-group">
                                                        <label for="report-email-validate"><?php echo language("REPORT_VERIFY_EMAIL_TITLE"); ?>*</label>
                                                        <input type="email" class="form-control" id="report-email-validate" placeholder="<?php echo language("REPORT_ENTER_EMAIL"); ?>">
                                                    </div>
                                                <?php
                                                    }
                                                ?>

                                                <?php
                                                    if (!$user->isLoggedIn()) {
                                                ?>
                                                    <div id="report-data-protection-div" class="form-check">
                                                        <input type="checkbox" class="form-check-input" id="report-data-protection">
                                                        <label id="report-data-protection-label" class="report-check-label label-like-url" for="report-data-protection"><?php echo language("REPORT_DATA_PROTECTION"); ?>*</label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input type="checkbox" class="form-check-input" id="report-contact">
                                                        <label id="report-contact-label" class="report-check-label label-like-url" for="report-contact"><?php echo language("REPORT_CONTACT"); ?></label>
                                                    </div>
                                                <?php
                                                    }
                                                ?>
                                                <button id="report-next" class="btn btn-secondary"><?php echo language("BUTTON_NEXT"); ?></button>
                                                <button id="report-save-single" class="btn btn-secondary"><?php echo language("REPORT_BUTTON_TITLE"); ?></button>
                                            </form>
                                        </div>
                                        <br>
                                        <br><br>
                                    </div>
                                    <?php
if ($user->isLoggedIn()) {
?>
                                    <div class="span3">
                                    </div>
                                    <div id="report-page2" class="span6">
                                        <div id="report-tools2">
                                            <form>
                                                <div class="form-category"><?php echo language("REPORT_BROADBAND_TITLE"); ?></div>
                                                <div id="report-count-div" class="form-group">
                                                    <label for="report-count"><?php echo language("REPORT_BROADBAND_COUNT"); ?>*</label>
                                                    <input type="number" min="1" max="100" step="1" class="form-control" id="report-count" placeholder="<?php echo language("REPORT_BROADBAND_ENTER_COUNT"); ?>">
                                                </div>
                                                <div class="form-group">
                                                    <label for="report-access-technology"><?php echo language("REPORT_BROADBAND_ACCESS_TECHNOLOGY"); ?></label>
                                                    <select id="report-access-technology" class="form-control"></select>
                                                </div>
                                                <div class="form-group" id="report-technology-form">
                                                    <label for="report-technology"><?php echo language("REPORT_BROADBAND_TECHNOLOGY"); ?></label>
                                                    <select id="report-technology" class="form-control"></select>
                                                </div>
                                                <div class="form-group">
                                                    <span class="smaller-fonts"><?php echo language("REPORT_BROADBAND_FIELD"); ?></span>
                                                    <div id="report-field"></div>
                                                </div>


                                                <div class="form-group" id="report-further-info-form">
                                                    <label for="report-further-info"><?php echo language("REPORT_BROADBAND_FURTHER_INFO_TITLE"); ?></label>
                                                    <textarea class="form-control" id="report-further-info" rows="3" cols="50" maxlength="200" placeholder="<?php echo language("REPORT_BROADBAND_ENTER_FURTHER_INFO"); ?>"></textarea>
                                                </div>

                                                <br>
                                                <button id="report-save-multiple" class="btn btn-secondary"><?php echo language("REPORT_BUTTON_TITLE"); ?></button>
                                            </form>
                                        </div>
                                    </div>
                                    <div class="span3">
                                    </div>
                                    <?php
}
?>
                                    <div id="report-map-div" class="span7">
                                        <div id="report-map"></div>
                                    </div>
                                </div>
                                <!-- row -->
                            </div>
                            <!-- tabpanel -->

                            <!-- Breitbandforum -->
                            <div role="tabpanel" class="tab-pane fade in" id="forum">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#forum" role="tab" data-toggle="tab">Breitbandforum</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                           
                                <br>
                                <div id='btk_forum_editable'>
                                </div>

                                <?php
                                if (hasPerm([2, 4])) {
                                    // Only permissions administrator, admin-bbp
                                ?>
                                <br>
                                    <button class="btn btn-primary" id="forum-startpage-edit">Editieren</button>
                                    <button class="btn btn-primary" id="forum-startpage-preview">Vorschau</button>
                                    <button class="btn btn-primary" id="forum-startpage-save">Speichern</button>
                                    <button class="btn btn-primary" id="forum-startpage-cancel">Abbrechen</button>
                                    <button class="btn btn-primary" id="forum-startpage-stop-preview">Vorschau beenden</button>
                                    <br>
                                    <br>
                                <?php
                                }
                                ?>
                                <br>

                                <div>
                                     <div>
                                         <a class="nav-link forum-link archive_link" href="#forum-archive" role="tab" data-toggle="tab">Archiv</a>
                                     </div>
                                     <div>
                                         <a class="nav-link forum-link provider_link" href="#forum-provider" role="tab" data-toggle="tab">Anbieter</a>
                                     </div>
                                     <div>
                                         <a class="nav-link forum-link technology_link" href="#forum-technology" role="tab" data-toggle="tab">Technologien</a>
                                     </div>
                                     <div>
                                         <a class="nav-link forum-link supply_link" href="#forum-supply" role="tab" data-toggle="tab">Breitbandversorgung</a>
                                     </div>
                                     <div>
                                         <a class="nav-link forum-link infos_link" href="#forum-infos" role="tab" data-toggle="tab">Weitere Informationen</a>
                                     </div>
                                 </div>
                            </div>

                    
                            <div role="tabpanel"  id='forum-content' class = 'tab-pane fade in'>
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#forum-content" role="tab" data-toggle="tab">Breitbandforum</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->

                                <div class="span12">
                                    <h1 class="title">Breitbandforum</h1>
                                </div>

                                <div class="row">
                                    <!--Archiv-->
                                    <div id="forum-archive" class="span12">
                                        <hr>
                                        <?php
                                            if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#news-body' id='forum-archive-collapse'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Archiv<div id="add-news" title="Neuigkeit hinzufügen">+</div></h3>
                                        <?php
                                        } else {
                                        ?>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#news-body' id='forum-archive-collapse'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Archiv</h3>
                                        <?php
                                        }
                                        ?>
                                        <div id="news-body" class='collapse'>
                                        </div>
                                    </div>

                                    <!--Provider -->
                                    <div id="forum-provider" class="span12">
                                        <hr>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#provider-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Anbieter<div id="forum-add-provider" title="Anbieter hinzufügen">+</div></h3>
                                        <?php
                                        } else {
                                        ?>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#provider-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Anbieter</h3>
                                        <?php
                                        }
                                        ?>
                                        <div id="provider-body" class='collapse'>
                                        </div>
                                    </div>

                                    <div id="forum-technology" class="span12">
                                        <hr>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#forum-technology-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Technologien</h3>
                                        <div id='forum-technology-body' class='collapse'>

                                        </div>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                        <button class="btn btn-primary" id="forum-technology-edit">Editieren</button>
                                        <button class="btn btn-primary" id="forum-technology-preview">Vorschau</button>
                                        <button class="btn btn-primary" id="forum-technology-save">Speichern</button>
                                        <button class="btn btn-primary" id="forum-technology-cancel">Abbrechen</button>
                                        <button class="btn btn-primary" id="forum-technology-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>
                                    </div>

                                    <div id="forum-supply" class="span12">
                                        <hr>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#forum-supply-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Breitbandversorgung</h3>
                                        <div id='forum-supply-body' class='collapse'>

                                        </div>
                                        <?php
                                        if (hasPerm([2, 4])) {
                                                // Only permissions administrator, admin-bbp
                                            ?>
                                            <br>
                                            <button class="btn btn-primary" id="forum-supply-edit">Editieren</button>
                                            <button class="btn btn-primary" id="forum-supply-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="forum-supply-save">Speichern</button>
                                            <button class="btn btn-primary" id="forum-supply-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="forum-supply-stop-preview">Vorschau beenden</button>
                                            <?php
                                            }
                                            ?>
                                    </div>

                                    <div id="forum-infos" class="span12">
                                        <hr>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#forum-infos-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;Weitere Informationen</h3>
                                        <div id='forum-infos-body' class='collapse'>
                                        </div>

                                            <?php
                                        if (hasPerm([2, 4])) {
                                                // Only permissions administrator, admin-bbp
                                            ?>
                                            <br>
                                            <button class="btn btn-primary" id="forum-infos-edit">Editieren</button>
                                            <button class="btn btn-primary" id="forum-infos-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="forum-infos-save">Speichern</button>
                                            <button class="btn btn-primary" id="forum-infos-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="forum-infos-stop-preview">Vorschau beenden</button>
                                            <?php
                                            }
                                            ?>
                                    </div>

                                    <?php
                                    if (hasPerm([2, 4])) {
                                        // Only permissions administrator, admin-bbp
                                    ?>
                                    <div id="forum-ihk" class="span12">
                                        <hr>
                                        <h3 class="forum-collapse" data-toggle='collapse' data-target='#forum-ihk-body'><i class="fa fa-chevron-right"></i>&nbsp;&nbsp;IHK</h3>
                                        <div id='forum-ihk-body' class='collapse'>

                                        </div>
                                        <br>
                                        <button class="btn btn-primary" id="forum-ihk-edit">Editieren</button>
                                        <button class="btn btn-primary" id="forum-ihk-preview">Vorschau</button>
                                        <button class="btn btn-primary" id="forum-ihk-save">Speichern</button>
                                        <button class="btn btn-primary" id="forum-ihk-cancel">Abbrechen</button>
                                        <button class="btn btn-primary" id="forum-ihk-stop-preview">Vorschau beenden</button>
                                    </div>
                                    <?php
                                    }
                                    ?>

                                </div>
                            </div>

                            <!-- HILFE --> 
                            <div role="tabpanel" class="tab-pane fade in" id="help">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#help" role="tab" data-toggle="tab"><?php echo language("INDEX_HELP_TITLE");?></a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div id="help-body">

                                    <!-- FAQ --> 
                                    <div id="help-faq"> 

                                        <div id="faq-body">
                                        </div>

                                        <!-- Edit FAQ --> 
                                        <?php
                                        if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                            <button class="btn btn-primary" id="faq-edit">Editieren</button>
                                            <button class="btn btn-primary" id="faq-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="faq-save">Speichern</button>
                                            <button class="btn btn-primary" id="faq-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="faq-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>
                                    
                                    </div>

                                    <br>
                                    <br>

                                    <!-- Glossar --> 

                                    <div id="help-glossar">

                                        <div id="glossar-body">
                                        </div>

                                        <!-- Edit FAQ --> 
                                        <?php
                                        if (hasPerm([2, 4])) {
                                            // Only permissions administrator, admin-bbp
                                        ?>
                                        <br>
                                            <button class="btn btn-primary" id="glossar-edit">Editieren</button>
                                            <button class="btn btn-primary" id="glossar-preview">Vorschau</button>
                                            <button class="btn btn-primary" id="glossar-save">Speichern</button>
                                            <button class="btn btn-primary" id="glossar-cancel">Abbrechen</button>
                                            <button class="btn btn-primary" id="glossar-stop-preview">Vorschau beenden</button>
                                        <?php
                                        }
                                        ?>

                                    </div>

                                    <br>

                                </div>
                                
                            </div>

                            <!-- Video --> 
                            <?php
                            if (hasPerm([2,4])) {

                            ?>

                            

                                <div role="tabpanel" class="tab-pane fade in" id="video-upload">

                                    <div class="row row-breadcrumb">
                                        <div class="span10">
                                            <nav class="breadcrumb">
                                            <ul>
                                                <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                                <li class="breadcrumb-item"><a href="#video-upload" role="tab" data-toggle="tab">Videos</a></li>
                                            </ul>
                                            </nav>
                                        </div>
                                    </div>

                                    <div class='container' id='list-uploaded-videos'>

                                        <h2>Hochgeladene Videos </h2>

                                        <br>

                                        <table id='table-uploaded-videos'>
                                        </table>

                                    </div>

                                    <br>

                                    <h2>Neue Videos hochladen (.mp4, .ogg, .webm)</h2>
                                    <h4>Größe: bis 300MB</h4>

                                    <br>

                                    <!-- Choose Video Data --> 
                                    
                                    <form action="">
                                        <input type="file" id="upload-button-video-file" name="" accept=".mp4,.ogg,.webm">
                                    </form>
                    
                                    <!-- Fill out the title --> 
                                    <div class="form-group">
                                        <label for="form-title-video">Titel für das neue Video</label>
                                        <input style='width:200px' class="form-control form-input" type="text" name="username" id="form-title-video" value="" placeholder="Titel eingeben...">
                                    </div>

                                    <br>

                                    <!-- <div id="progress">
                                        <div class="bar" style="width: 0%;"></div>
                                    </div>-->

                                    <button class="btn btn-primary" id="button-video-upload">Video Hochladen</button>

                                    

                            
                                </div>

                            <?php
                            }
                            ?>

                            <!-- Login -->
                            <?php
if (!$user->isLoggedIn()) {
?>
                            <div role="tabpanel" class="tab-pane fade in" id="konto">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#konto" role="tab" data-toggle="tab">Mein Konto</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <!-- Login -->
                                <?php
    $token_passed = true;
    ini_set("allow_url_fopen", 1);
    //if(isset($_SESSION)){session_destroy();}
    $settings = $db->query("SELECT * FROM settings")->first();
    $hooks = getMyHooks();
    if ($settings->twofa == 1) {
        $google2fa = new PragmaRX\Google2FA\Google2FA();
    }
    if (ipCheckBan()) {
        Redirect::to($us_url_root . 'usersc/scripts/banned.php');
        die();
    }
    $errors = [];
    $successes = [];
    if (@$_REQUEST['err']) $errors[] = $_REQUEST['err']; // allow redirects to display a message
    $reCaptchaValid = FALSE;
    if ($user->isLoggedIn()) Redirect::to($us_url_root . 'index.php');
    if (!empty($_POST['login_hook'])) {
        //                                      $token = Input::get('csrf');
        $token = $_POST['csrf'];
        //                                      if(!Token::check($token)){
        if ($token != $_SESSION["custom_token"]) {
            //                                        include($abs_us_root.$us_url_root.'usersc/scripts/token_error.php');
            //                                        echo language("LOGIN_FAIL") . language("LOGIN_PLEASE_TRY_AGAIN");
            $token_passed = false;
        }
        //Check to see if recaptcha is enabled
        if ($settings->recaptcha == 1) {
            //require_once $abs_us_root.$us_url_root.'users/includes/recaptcha.config.php';
            //reCAPTCHA 2.0 check
            $response = null;
            // check secret key
            $reCaptcha = new \ReCaptcha\ReCaptcha($settings->recap_private);
            // if submitted check response
            if ($_POST["g-recaptcha-response"]) {
                $response = $reCaptcha->verify($_POST["g-recaptcha-response"], $_SERVER["REMOTE_ADDR"]);
            }
            if ($response != null && $response->isSuccess()) {
                $reCaptchaValid = TRUE;
            } else {
                $reCaptchaValid = FALSE;
                $errors[] = lang("CAPTCHA_ERROR");
                $reCapErrors = $response->getErrorCodes();
                foreach ($reCapErrors as $error) {
                    logger(1, "Recapatcha", "Error with reCaptcha: " . $error);
                }
            }
        } else {
            $reCaptchaValid = TRUE;
        }
        if ($reCaptchaValid || $settings->recaptcha == 0) { //if recaptcha valid or recaptcha disabled
            $validate = new Validate();
            $validation = $validate->check($_POST, array('username' => array('display' => 'Username', 'required' => true), 'password' => array('display' => 'Password', 'required' => true)));
            //plugin goes here with the ability to kill validation
            includeHook($hooks, 'post');
            if ($validation->passed()) {
                //Log user in
                $remember = (Input::get('remember') === 'on') ? true : false;
                $user = new User();
                $login = $user->loginEmail(Input::get('username'), trim(Input::get('password')), $remember);
                if (!$token_passed) {
                    $login = false;
                    session_unset();
                }
                if ($login) {
                    $dest = sanitizedDest('dest');
                    $twoQ = $db->query("select twoKey from users where id = ? and twoEnabled = 1", [$user->data()->id]);
                    if ($twoQ->count() > 0) {
                        $_SESSION['twofa'] = 1;
                        if (!empty($dest)) {
                            $page = encodeURIComponent(Input::get('redirect'));
                            logger($user->data()->id, "Two FA", "Two FA being requested.");
                            Redirect::to($us_url_root . 'users/twofa.php?dest=' . $dest . '&redirect=' . $page);
                        } else Redirect::To($us_url_root . 'users/twofa.php');
                    } else {
                        # if user was attempting to get to a page before login, go there
                        $_SESSION['last_confirm'] = date("Y-m-d H:i:s");
                        //check for need to reAck terms of service
                        if ($settings->show_tos == 1) {
                            if ($user->data()->oauth_tos_accepted == 0) {
                                Redirect::to($us_url_root . 'users/user_agreement_acknowledge.php');
                            }
                        }
                        if (!empty($dest)) {
                            $redirect = htmlspecialchars_decode(Input::get('redirect'));
                            if (!empty($redirect) || $redirect !== '') Redirect::to($redirect);
                            else Redirect::to($dest);
                        } elseif (file_exists($abs_us_root . $us_url_root . 'usersc/scripts/custom_login_script.php')) {
                            # if site has custom login script, use it
                            # Note that the custom_login_script.php normally contains a Redirect::to() call
                            require_once $abs_us_root . $us_url_root . 'usersc/scripts/custom_login_script.php';
                        } else {
                            if (($dest = Config::get('homepage')) || ($dest = 'account.php')) {
                                #echo "DEBUG: dest=$dest<br />\n";
                                #die;
                                Redirect::to($dest);
                            }
                        }
                    }
                } else {
                    echo "<div>" . language("LOGIN_FAIL") . language("LOGIN_PLEASE_CHK") . "</div>";
                }
            }
        }
    }
    if (empty($dest = sanitizedDest('dest'))) {
        $dest = '';
    }
    $token = Token::generate();
    session_start();
    $_SESSION["custom_token"] = $token;
?>
                                <div class="row">
                                    <div class="span3">
                                    </div>
                                    <div class="span6">
                                        <?php
    includeHook($hooks, 'body');
    if ($settings->glogin == 1 && !$user->isLoggedIn()) {
        require_once $abs_us_root . $us_url_root . 'users/includes/google_oauth_login.php';
    }
    if ($settings->fblogin == 1 && !$user->isLoggedIn()) {
        require_once $abs_us_root . $us_url_root . 'users/includes/facebook_oauth.php';
    }
    // Find url for post request
    // We do it to prevent breaking when not having index.php in the url
    $protocol = "http://";
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') {
        $protocol = "https://";
    }
    $post_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'] . "#konto";
?>
                                        <?php
    echo '<form name="login" id="login-form" class="form-signin" action="' . $post_url . '" method="post">';
?>
                                        <input type="hidden" name="dest" value="<?=$dest
?>" />
                                        <div class="form-group">
                                            <label for="username"><?php echo language("LOGIN_USERNAME"); ?></label>
                                            <input  class="form-control" type="text" name="username" id="username" placeholder="<?php echo language("LOGIN_USERNAME"); ?>" required autofocus autocomplete="username">
                                        </div>
                                        <div class="form-group">
                                            <label for="password"><?php echo language("LOGIN_PASSWORD"); ?></label>
                                            <input type="password" class="form-control"  name="password" id="password"  placeholder="<?php echo language("LOGIN_PASSWORD"); ?>" required autocomplete="current-password">
                                        </div>
                                        <a id="forgot-password-button" class="nav-link" href="#passwort-zuruecksetzen" role="tab" data-toggle="tab"><?php echo language("LOGIN_FORGOT_PASS"); ?></a>
                                        <?php includeHook($hooks, 'form'); ?>
                                        <div class="form-group">
                                            <label for="remember">
                                            <input type="checkbox" name="remember" id="remember" checked hidden></label>
                                        </div>
                                        <input type="hidden" name="login_hook" value="1">
                                        <input type="hidden" name="csrf" value="<?=$token
?>">
                                        <input type="hidden" name="redirect" value="<?=Input::get('redirect') ?>" />
                                        <button class="submit  btn  btn-primary" id="next_button" type="submit"><i class="fa fa-sign-in"></i> <?php echo language("LOGIN_BUTTON_TEXT"); ?></button>
                                        <?php
    if ($settings->recaptcha == 1) {
?>
                                        <div class="g-recaptcha" data-sitekey="<?=$settings->recap_public; ?>" data-bind="next_button" data-callback="submitForm"></div>
                                        <?php
    } ?>
                                        </form>

                                            <div>
                                                <br>
                                                <b><?php echo language("LOGIN_REGISTER_TEXT"); ?></b>
                                                <br>
                                                <a id="login-register-button" class="nav-link btn btn-info" href="#registrieren" role="tab" data-toggle="tab" aria-controls="report"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> <?php echo language("LOGIN_REGISTER_BUTTON"); ?></a>
                                                </div>

                                        <?php includeHook($hooks, 'bottom'); ?>
                                    </div>
                                </div>
                                <?php if ($settings->recaptcha == 1) { ?>
                                <script src="https://www.google.com/recaptcha/api.js" async defer></script>
                                <script>
                                    function submitForm() {
                                      document.getElementById("login-form").submit();
                                    }
                                </script>
                                <?php
    } ?>
                                <div class="span3">
                                </div>
                            </div>
                            <?php
}
?>

                            <!-- Forgot password -->
                            <div role="tabpanel" class="tab-pane fade in" id="passwort-zuruecksetzen">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item"><a href="#konto" class="login-button" role="tab" data-toggle="tab">Mein Konto</a></li>
                                            <li class="breadcrumb-item"><a href="#passwort-zuruecksetzen" role="tab" data-toggle="tab">Passwort zurücksetzen</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->

                                <div class="row">
                                    <div class="span3">
                                    </div>
                                    <div class="span6">
                                        <h2>Passwort zurücksetzen</h2>
                                        <br>
                                        <?php
$forgot_password_token = Token::generate();
session_start();
$_SESSION["custom_forgot_password_token"] = $forgot_password_token;
?>
                                        <form id="forgot-password-form" action="php/forgot-password.php" method="post" class="form ">
                                            <div class="form-group">
                                            <label for="email">E-Mail-Adresse eingeben und auf Zurücksetzen klicken:</label>
                                            <input type="text" name="email" placeholder="E-Mail-Adresse" class="form-control" autofocus autocomplete='email'>
                                            </div>

                                            <?php
echo '<input type="hidden" name="csrf" value="' . $forgot_password_token . '">';
?>
                                            <p><input type="submit" name="forgotten_password" value="Zurücksetzen" class="btn btn-primary"></p>
                                        </form>
                                    </div>
                                    <div class="span3">
                                    </div>
                                </div>
                            </div>

                            <!-- Register -->
<?php
if (!$user->isLoggedIn()) {
?>
                            <div role="tabpanel" class="tab-pane fade in" id="registrieren">
                            <!-- Breadcrumb START -->
                            <div class="row row-breadcrumb">
                                <div class="span10">
                                    <nav class="breadcrumb">
                                      <ul>
                                        <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                        <li class="breadcrumb-item"><a href="#konto" class="login-button" role="tab" data-toggle="tab">Mein Konto</a></li>
                                        <li class="breadcrumb-item"><a href="#registrieren" role="tab" data-toggle="tab">Registrieren</a></li>
                                      </ul>
                                    </nav>
                                </div>
                            </div>
                            <!-- Breadcrumb END -->


                                <?php
    $hooks = getMyHooks();
    if (ipCheckBan()) {
        Redirect::to($us_url_root . 'usersc/scripts/banned.php');
        die();
    }
    if ($user->isLoggedIn()) Redirect::to($us_url_root . 'index.php');
    if ($settings->recaptcha == 1 || $settings->recaptcha == 2) {
        //require_once($abs_us_root.$us_url_root."users/includes/recaptcha.config.php");

    }
    $vericode = randomstring(15);
    $form_valid = FALSE;
    //Decide whether or not to use email activation
    $query = $db->query("SELECT * FROM email");
    $results = $query->first();
    $act = $results->email_act;
    //Opposite Day for Pre-Activation - Basically if you say in email
    //settings that you do NOT want email activation, this lists new
    //users as active in the database, otherwise they will become
    //active after verifying their email.
    if ($act == 1) {
        $pre = 0;
    } else {
        $pre = 1;
    }
    $reCaptchaValid = FALSE;
    //Input exists
    if (Input::exists() && isset($_POST["registration"])) {
        //    $token = $_POST['csrf'];
        //     if(!Token::check($token)){
        ////        include($abs_us_root.$us_url_root.'usersc/scripts/token_error.php');
        //        echo language("REGISTER_FAIL") . language("REGISTER_PLEASE_TRY_AGAIN");
        //     }
        $token_passed = true;
        $validate_passed = true;
        // $token = Input::get('csrf');
        $token = $_POST['csrf'];
        //  if(!Token::check($token)){
        //echo "Token POST: " . $_POST['csrf'] . " Token Session: " . $_SESSION["custom_registration_token"] . "        ";
        $error_message = "";
        if ($token != $_SESSION["custom_registration_token"]) {
            $token_passed = false;
        }
        // Get data
        $salutation = $_POST['salutation'];
        $fname = $_POST['fname'];
        $lname = $_POST['lname'];
        $email = $_POST['email'];
        $username = $_POST['username'];
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm'];
        $street_number = $_POST['street-number'];
        $postcode_area = $_POST['postcode-area'];
        $organization = $_POST['organization'];
        $sector = $_POST['sector'];
        $telephone = $_POST['telephone'];
        $further_info = $_POST['further-info'];
        $data_protection = $_POST['data-protection'];
        $contact = $_POST['contact'];
        // Sanitize
        $salutation = trim(strip_tags($salutation));
        $fname = trim(strip_tags($fname));
        $lname = trim(strip_tags($lname));
        $email = trim(strip_tags($email));
        $username = trim(strip_tags($username));
        $password = trim(strip_tags($password));
        $confirm_password = trim(strip_tags($confirm_password));
        //$street_number = trim(strip_tags($street_number));
        $postcode_area = trim(strip_tags($postcode_area));
        $organization = trim(strip_tags($organization));
        $sector = trim(strip_tags($sector));
        $telephone = trim(strip_tags($telephone));
        $further_info = trim(strip_tags($further_info));
        $data_protection = trim(strip_tags($data_protection));
        $contact = trim(strip_tags($contact));
        // Validate salutation
        $salutation_options = $breitbandconfig_array['salutation'];
        if (!in_array($salutation, $salutation_options)) {
            $validate_passed = false;
        }
        // Validate username (4 - 30 characters)
        if (strlen($username) == 0) {
            $error_message.= language("REGISTER_MISSING_USERNAME");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($username) < 4 || strlen($username) > 30) {
            $error_message.= language("REGISTER_INVALID_USERNAME");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if ($db->get("users", ["username", "=", $username])) {
            if ($db->count()) {
                $error_message.= language("REGISTER_USERNAME_ALREADY_EXISTS");
                $error_message.= "<br>";
                $validate_passed = false;
            }
        }
        // Validate email
        if (strlen($email) == 0) {
            $error_message.= language("REGISTER_MISSING_EMAIL");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error_message.= language("REGISTER_INVALID_EMAIL");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if ($db->get("users", ["email", "=", $email])) {
            if ($db->count()) {
                $error_message.= language("REGISTER_EMAIL_ALREADY_EXISTS");
                $error_message.= "<br>";
                $validate_passed = false;
            }
        }
        // Validate first name
        if (strlen($fname) == 0) {
            $error_message.= language("REGISTER_MISSING_FIRST_NAME");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($fname) > 255) {
            $validate_passed = false;
        }
        // Validate last name
        if (strlen($lname) == 0) {
            $error_message.= language("REGISTER_MISSING_LAST_NAME");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($lname) > 255) {
            $validate_passed = false;
        }
        // Validate street/number
        if (strlen($street_number) == 0) {
            $error_message.= language("REGISTER_MISSING_STREET_NUMBER");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($street_number) > 255) {
            $validate_passed = false;
        }
        // Validate postcode/area
        if (strlen($postcode_area) == 0) {
            $error_message.= language("REGISTER_MISSING_POSTCODE_AREA");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($postcode_area) > 255) {
            $validate_passed = false;
        }
        // Validate password (6 - 30 characters)
        if (strlen($password) == 0) {
            $error_message.= language("REGISTER_MISSING_PASSWORD");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($confirm_password) == 0) {
            $error_message.= language("REGISTER_MISSING_VERIFY_PASSWORD");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if ($password != $confirm_password) {
            $error_message.= language("REGISTER_PASSWORDS_DO_NOT_MATCH");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        if (strlen($password) < 6 || strlen($password) > 30) {
            $error_message.= language("REGISTER_INVALID_PASSWORD");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        // Validate data protection
        if (!isset($data_protection) || $data_protection != "1") {
            $error_message.= language("REGISTER_DATA_PROTECTION_NOT_ACCEPTED");
            $error_message.= "<br>";
            $validate_passed = false;
        }
        // Optional: sector
        if (!array_key_exists($sector, $breitbandconfig_array['sector'])) {
            $sector = "";
        } else {
            $sector = $breitbandconfig_array['sector'][$sector];
        }
        if ($validate_passed && $token_passed) {
            $form_valid = TRUE;
            // Without recaptcha
            //add user to the database
            $user = new User();
            $join_date = date("Y-m-d H:i:s");
            $params = array('fname' => Input::get('fname'), 'email' => $email, 'username' => $username, 'vericode' => $vericode, 'join_vericode_expiry' => $settings->join_vericode_expiry);
            $vericode_expiry = date("Y-m-d H:i:s");
            if ($act == 1) {
                //Verify email address settings
                $from = "verification@breitband.berlin.de";
                $to = rawurlencode($email);
                $subject = "Berliner Breitband Portal";
                $headers = 'From: ' . $from . "\r\n" . 'Reply-To: ' . $from . "\r\n" . "Content-Type: text/html; charset=utf-8\r\n";
                $url = $_SERVER["REQUEST_SCHEME"] . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
                $url = str_replace("php/" . basename($_SERVER['REQUEST_URI']), "index.php?", $url);
                $email_base64_encode = base64_encode($email);
                $link_to_click = $url . '?register=true&code=' . $vericode . '&email=' . $email_base64_encode;
                $link = '<a href="' . $link_to_click . '">' . $link_to_click . '</a>';
                $message = "Bitte klicken Sie auf den Link, um Ihre E-Mail-Adresse zu verifizieren:<br> " . $link . "<br><br>Dieser Link ist nur 24 Stunden gültig. Bei Nichtbestätigung wird Ihr Konto gelöscht.";
                mail($email, $subject, $message, $headers);
                $vericode_expiry = date("Y-m-d H:i:s", strtotime("+$settings->join_vericode_expiry hours", strtotime(date("Y-m-d H:i:s"))));
            }
            try {
                // echo "Trying to create user";
                $theNewId = $user->create(array('username' => $username, 'fname' => $fname, 'lname' => $lname, 'email' => $email, 'password' => password_hash($password, PASSWORD_BCRYPT, array('cost' => 12)), 'permissions' => 1, 'account_owner' => 1, 'join_date' => $join_date, 'email_verified' => $pre, 'active' => 1, 'vericode' => $vericode, 'vericode_expiry' => $vericode_expiry, 'oauth_tos_accepted' => true, 'anrede' => $salutation, 'vorname' => $fname, 'nachname' => $lname, 'telefon' => $telephone, 'strasse' => $street_number, 'plzort' => $postcode_area, 'unternehmen' => $organization, 'bereich' => $sector, 'contact' => $contact, 'weitere' => $further_info));
                includeHook($hooks, 'post');
                echo language("REGISTER_SUCCESS") . "<br>";
            }
            catch(Exception $e) {
                echo '<b>' . language("REGISTER_FAIL") . "</b><br>";
            }
        } else {
            echo '<b>' . language("REGISTER_FAIL") . "</b><br>";
        }
    }
    $register_post_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'] . "#registrieren";
    $token = Token::generate();
    session_start();
    $_SESSION["custom_registration_token"] = $token;
    if (!$form_valid && Input::exists()) {
        echo $error_message;
    }
    includeHook($hooks, 'body');
?>

                                <div class="row">
                                    <div class="span3">
                                    </div>
                                    <div class="span6">
                                    <?php
    echo '<form class="form-signup" id="register-form" action="' . $register_post_url . '" method="post" accept-charset="UTF-8">';
?>


                                        <h2 id="register-title" class="form-signin-heading"><?php echo language("REGISTER_TITLE"); ?></h2>
                                        <br>

                                        <h3 class="form-signin-heading"><?php echo language("REGISTER_OBLIGATORY_FIELDS"); ?></h3>
                                        <div class="form-group">
                                            <label for="register-salutation"><?php echo language("REGISTER_SALUTATION"); ?>*</label>
                                            <select id="register-salutation" class="form-control" name="salutation" required>
                                                <?php
    $salutation_options = $breitbandconfig_array['salutation'];
    foreach ($salutation_options as $single_salutation) {
        echo "<option value='" . $single_salutation . "'>" . $single_salutation . "</option>";
    }
?>
                                            </select>
                                        </div>

                                        <div class="form-group">
                                            <label for="register-first-name"><?php echo language("REGISTER_FIRST_NAME"); ?>*</label>
                                            <input  class="form-control" id="register-first-name" type="text" name="fname" placeholder="<?php echo language("REGISTER_FIRST_NAME"); ?>" required>
                                        </div>

                                        <div class="form-group">
                                            <label for="register-last-name"><?php echo language("REGISTER_LAST_NAME"); ?>*</label>
                                            <input  class="form-control" id="register-last-name" type="text" name="lname" placeholder="<?php echo language("REGISTER_LAST_NAME"); ?>" required>
                                        </div>

                                        <div class="form-group">
                                            <label for="register-street-number"><?php echo language("REGISTER_STREET_NUMBER"); ?>*</label>
                                            <input  class="form-control" id="register-street-number" type="text" name="street-number" placeholder="<?php echo language("REGISTER_STREET_NUMBER"); ?>" required>
                                        </div>

                                        <div class="form-group">
                                            <label for="register-postcode-area"><?php echo language("REGISTER_POSTCODE_AREA"); ?>*</label>
                                            <input  class="form-control" id="register-postcode-area" type="text" name="postcode-area" placeholder="<?php echo language("REGISTER_POSTCODE_AREA"); ?>" required>
                                        </div>

                                        <br>
                                        <h3 class="form-signin-heading"><?php echo language("REGISTER_ACCOUNT_FIELDS"); ?></h3>
                                        <div class="form-group">
                                            <label for="register-username"><?php echo language("REGISTER_USERNAME"); ?>*</label>
                                            <input  class="form-control" id="register-username" type="text" name="username" placeholder="<?php echo language("LOGIN_USERNAME"); ?>" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="register-password"><?php echo language("REGISTER_PASSWORD"); ?>*</label>
                                            <input  class="form-control" id="register-password" type="password" name="password" placeholder="<?php echo language("LOGIN_PASSWORD"); ?>" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="register-confirm-password"><?php echo language("REGISTER_VERIFY_PASSWORD"); ?>*</label>
                                            <input  class="form-control" id="register-confirm-password" type="password" name="confirm" placeholder="<?php echo language("LOGIN_PASSWORD"); ?>" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="register-email"><?php echo language("REGISTER_EMAIL"); ?>*</label>
                                            <input  class="form-control" id="register-email" type="text" name="email" placeholder="<?php echo language("REGISTER_EMAIL"); ?>" required>
                                        </div>

                                        <br>
                                        <h3 class="form-signin-heading"><?php echo language("REGISTER_OPTIONAL_FIELDS"); ?></h3>

                                        <div class="form-group">
                                            <label for="register-organization"><?php echo language("REGISTER_ORGANIZATION"); ?></label>
                                            <input  class="form-control" id="register-organization" type="text" name="organization" placeholder="<?php echo language("REGISTER_ORGANIZATION"); ?>">
                                        </div>

                                        <!-- <div class="form-group">
                                            <label for="register-sector"><?php echo language("REGISTER_SECTOR"); ?></label>
                                            <input  class="form-control" id="register-sector" type="text" name="sector" placeholder="<?php echo language("REGISTER_SECTOR"); ?>">
                                        </div> -->

                                         <div class="form-group">
                                            <label for="register-sector"><?php echo language("REGISTER_SECTOR"); ?></label>
                                            <select id="register-sector" class="form-control" name="sector">
                                                <option class="disabled-selection" value="-1" selected="" disabled=""><?php echo language("REGISTER_SECTOR"); ?></option>
                                                <?php
    $sector_options = $breitbandconfig_array['sector'];
    foreach ($sector_options as $single_sector_id => $single_sector) {
        echo "<option value='" . $single_sector_id . "'>" . $single_sector . "</option>";
    }
?>
                                            </select>
                                        </div>

                                        <div class="form-group">
                                            <label for="register-telephone"><?php echo language("REGISTER_TELEPHONE"); ?></label>
                                            <input  class="form-control" id="register-telephone" type="text" name="telephone" placeholder="<?php echo language("REGISTER_TELEPHONE"); ?>">
                                        </div>

                                        <div class="form-group">
                                            <label for="register-further-info"><?php echo language("REGISTER_FURTHER_INFORMATION"); ?></label>
                                            <textarea class="form-control" id="register-further-info" rows="4" cols="50" maxlength="500" name="further-info" placeholder="<?php echo language("REGISTER_FURTHER_INFORMATION"); ?>"></textarea>
                                        </div>

                                        <br>
                                        <div id="register-data-protection-div" class="form-group">
                                            <input type="checkbox" class="form-check-input" id="register-data-protection" name="data-protection" value="1" required>
                                            <label id="register-data-protection-label" class="register-check-label label-like-url" for="register-data-protection"><?php echo language("REPORT_DATA_PROTECTION"); ?>*</label>
                                        </div>
                                        <div class="form-group">
                                            <input type="checkbox" class="form-check-input" id="register-contact" name="contact" value="1">
                                            <label id="register-contact-label" class="register-check-label label-like-url" for="register-contact"><?php echo language("REPORT_CONTACT"); ?></label>
                                        </div>

                                        <input type="hidden" name="registration" value="true">
                                        <input type="hidden" name="csrf" value="<?=$token ?>">
                                        <br>
                                        <button class="submit  btn  btn-primary" id="register-submit" type="submit"><?php echo language("LOGIN_REGISTER_BUTTON"); ?></button>
                                    </form>

                                    </div>
                                    <div class="span3">
                                    </div>
                                </div>
                                <?php
    includeHook($hooks, 'bottom');
    if ($settings->recaptcha == 1 || $settings->recaptcha == 2) { ?>
                                <script src="https://www.google.com/recaptcha/api.js" async defer></script>
                                <?php
    } ?>

                            </div>
<?php
}
?>

                            <!-- Profile -->
                            <div role="tabpanel" class="tab-pane fade in" id="profil">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Mein Konto</li>
                                            <li class="breadcrumb-item"><a href="#profil" role="tab" data-toggle="tab">Mein Profil</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->


<?php
$hooks = getMyHooks();
$settings = $db->query("SELECT * FROM settings")->first();
//dealing with if the user is logged in
if ($user->isLoggedIn() && !checkMenu(2, $user->data()->id)) {
    if (($settings->site_offline == 1) && (!in_array($user->data()->id, $master_account)) && ($currentPage != 'login.php') && ($currentPage != 'maintenance.php')) {
        $user->logout();
        Redirect::to($us_url_root . 'users/maintenance.php');
    }
}
$emailQ = $db->query("SELECT * FROM email");
$emailR = $emailQ->first();
// dump($emailR);
// dump($emailR->email_act);
//PHP Goes Here!
$errors = [];
$successes = [];
$error_message = "";
$success_message = "";
$userId = $user->data()->id;
$grav = get_gravatar(strtolower(trim($user->data()->email)));
$validation = new Validate();
$userdetails = $user->data();
//Temporary Success Message
$holdover = Input::get('success');
if ($holdover == 'true') {
    bold("Account Updated");
}
//Forms posted
if (!empty($_POST) && isset($_POST["profile"])) {
    $postgres_config = include ('php/db_connection.php');
    $postgres_host = $postgres_config['host'];
    $postgres_port = $postgres_config['port'];
    $postgres_dbname = $postgres_config['dbname'];
    $postgres_user = $postgres_config['user'];
    $postgres_password = $postgres_config['password'];
    $dbconn = pg_connect("host=$postgres_host port=$postgres_port dbname=$postgres_dbname user=$postgres_user password=$postgres_password") or die('Error');
    $token = $_POST['csrf'];
    if ($token != $_SESSION["custom_profile_token"]) {
        echo "Token Error";
    } else {
        includeHook($hooks, 'post');
        //Update first name
        $fname = trim(strip_tags($_POST['fname']));
        if ($userdetails->fname != $fname) {
            $fields = array('fname' => $fname, 'vorname' => $fname);
            $validation->check($_POST, array('fname' => array('required' => true, 'min' => 1, 'max' => 255)));
            if ($validation->passed()) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET vorname = $1 WHERE username = $2;" or die();
                $params_profile = array($fname, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_FIRST_NAME_UPDATED");
                $success_message.= "<br>";
                logger($user->data()->id, "User", "Changed fname from $userdetails->fname to $fname.");
            } else {
                $error_message.= language("PROFILE_FIRST_NAME_FAILED");
                $error_message.= "<br>";
            }
        } else {
            $fname = $userdetails->fname;
        }
        //Update last name
        $lname = trim(strip_tags($_POST['lname']));
        if ($userdetails->lname != $lname) {
            $fields = array('lname' => $lname, 'nachname' => $lname);
            $validation->check($_POST, array('lname' => array('required' => true, 'min' => 1, 'max' => 255)));
            if ($validation->passed()) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET nachname = $1 WHERE username = $2;" or die();
                $params_profile = array($lname, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_LAST_NAME_UPDATED");
                $success_message.= "<br>";
                logger($user->data()->id, "User", "Changed lname from $userdetails->lname to $lname.");
            } else {
                $error_message.= language("PROFILE_LAST_NAME_FAILED");
                $error_message.= "<br>";
            }
        } else {
            $lname = $userdetails->lname;
        }
        if (!empty($_POST['password']) || $userdetails->email != $_POST['email'] || !empty($_POST['resetPin'])) {
            //Check password for email or pw update
            if (is_null($userdetails->password) || password_verify(Input::get('old'), $user->data()->password)) {
                //Update email
                $email = trim(strip_tags($_POST['email']));
                if ($userdetails->email != $email) {
                    $confemail = trim(strip_tags($_POST['confemail']));
                    $fields = array('email' => $email);
                    $validation->check($_POST, array('email' => array('required' => true, 'valid_email' => true, 'unique_update' => 'users,' . $userId, 'min' => 3, 'max' => 75)));
                    if ($validation->passed()) {
                        if ($confemail == $email) {
                            if ($emailR->email_act == 0) {
                                $db->update('users', $userId, $fields);
                                $success_message.= language("PROFILE_EMAIL_UPDATED");
                                $success_message.= "<br>";
                                logger($user->data()->id, "User", "Changed email from $userdetails->email to $email.");
                            }
                            if ($emailR->email_act == 1) {
                                $vericode = randomstring(15);
                                $vericode_expiry = date("Y-m-d H:i:s", strtotime("+$settings->join_vericode_expiry hours", strtotime(date("Y-m-d H:i:s"))));
                                $db->update('users', $userId, ['email_new' => $email, 'vericode' => $vericode, 'vericode_expiry' => $vericode_expiry]);
                                //Send the email
                                $from = "verification@breitband.berlin.de";
                                $to = rawurlencode($email);
                                $subject = "Berliner Breitband Portal";
                                $headers = 'From: ' . $from . "\r\n" . 'Reply-To: ' . $from . "\r\n" . "Content-Type: text/html; charset=utf-8\r\n";
                                $url = $_SERVER["REQUEST_SCHEME"] . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
                                $url = str_replace("php/" . basename($_SERVER['REQUEST_URI']), "index.php?", $url);
                                $email_base64_encode = base64_encode($email);
                                $link_to_click = $url . '?changemail=true&code=' . $vericode . '&email=' . $email_base64_encode;
                                $link = '<a href="' . $link_to_click . '">' . $link_to_click . '</a>';
                                $message = "Bitte klicken Sie auf den Link, um Ihre E-Mail-Adresse zu verifizieren:<br> " . $link . "<br><br>Dieser Link ist nur 24 Stunden gültig.";
                                mail($email, $subject, $message, $headers);
                            }
                        } else {
                            $error_message.= language("PROFILE_EMAILS_DO_NOT_MATCH");
                            $error_message.= "<br>";
                        }
                    } else {
                        $error_message.= "E-Mail Fehler";
                        $error_message.= "<br>";
                    }
                } else {
                    $email = $userdetails->email;
                }
                if (!empty($_POST['password'])) {
                    $validation->check($_POST, array('password' => array('required' => true, 'min' => $settings->min_pw, 'max' => $settings->max_pw,), 'confirm' => array('required' => true, 'matches' => 'password',),));
                    $password = trim(strip_tags($_POST['password']));
                    $confirm = trim(strip_tags($_POST['confirm']));
                    $old = trim(strip_tags($_POST['old']));
                    if ($password != $confirm) {
                        $error_message.= language("REGISTER_PASSWORDS_DO_NOT_MATCH");
                        $error_message.= "<br>";
                    } elseif ($validation->passed() && $old != $password) {
                        $new_password_hash = password_hash($password, PASSWORD_BCRYPT, array('cost' => 12));
                        $user->update(array('password' => $new_password_hash, 'force_pr' => 0, 'vericode' => randomstring(15),), $user->data()->id);
                        $success_message.= language("PROFILE_PASSWORD_UPDATED");
                        $success_message.= "<br>";
                        logger($user->data()->id, "User", "Updated password.");
                        if ($settings->session_manager == 1) {
                            $passwordResetKillSessions = passwordResetKillSessions();
                            if (is_numeric($passwordResetKillSessions)) {
                                if ($passwordResetKillSessions == 1) $successes[] = lang("SESS_SUC") . " 1 " . lang("GEN_SESSION");
                                if ($passwordResetKillSessions > 1) $successes[] = lang("SESS_SUC") . $passwordResetKillSessions . lang("GEN_SESSIONS");
                            } else {
                                $error_message.= "Error";
                                $error_message.= "<br>";
                            }
                        }
                    } else {
                        if ($old == $password) {
                            $error_message.= language("PROFILE_PASSWORD_SAME");
                            $error_message.= "<br>";
                        } else {
                            $error_message.= language("PROFILE_PASSWORD_FAILED");
                            $error_message.= "<br>";
                        }
                    }
                }
            } else {
                $error_message.= language("PROFILE_UPDATE_OLD_PASSWORD_WRONG");
                $error_message.= "<br>";
            }
        }
        //Update Anrede
        $salutation = trim(strip_tags($_POST['salutation']));
        if ($userdetails->anrede != $salutation) {
            $salutation_options = $breitbandconfig_array['salutation'];
            if (in_array($salutation, $salutation_options)) {
                $db->update('users', $userId, ['anrede' => $salutation]);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET anrede = $1 WHERE username = $2;" or die();
                $params_profile = array($salutation, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_SALUTATION_UPDATED");
                $success_message.= "<br>";
            }
        }
        //Update street-number
        $street_number = trim(strip_tags($_POST['street-number']));
        if ($userdetails->strasse != $street_number) {
            $fields = array('strasse' => $street_number);
            if (strlen($street_number) > 0 && strlen($street_number) <= 255) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET benutzerstrasse = $1 WHERE username = $2;" or die();
                $params_profile = array($street_number, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_STREET_NUMBER_UPDATED");
                $success_message.= "<br>";
            } else {
                //validation did not pass
                $error_message.= language("PROFILE_STREET_NUMBER_FAILED");
                $error_message.= "<br>";
            }
        } else {
            $street_number = $userdetails->strasse;
        }
        //Update postcode-area
        $postcode_area = trim(strip_tags($_POST['postcode-area']));
        if ($userdetails->plzort != $postcode_area) {
            $fields = array('plzort' => $postcode_area);
            if (strlen($postcode_area) > 0 && strlen($postcode_area) <= 255) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET benutzerort = $1 WHERE username = $2;" or die();
                $params_profile = array($postcode_area, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_POSTCODE_AREA_UPDATED");
                $success_message.= "<br>";
            } else {
                $error_message.= language("PROFILE_POSTCODE_AREA_FAILED");
                $error_message.= "<br>";
            }
        } else {
            $postcode_area = $userdetails->plzort;
        }
        //Update organization (optional)
        $organization = trim(strip_tags($_POST['organization']));
        $fields = array('unternehmen' => $organization);
        if ($userdetails->unternehmen != $organization) {
            if (strlen($organization) <= 255) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET unternehmen = $1 WHERE username = $2;" or die();
                $params_profile = array($organization, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_ORGANIZATION_UPDATED");
                $success_message.= "<br>";
            } else {
                $error_message.= language("PROFILE_ORGANIZATION_FAILED");
                $error_message.= "<br>";
            }
        }
        //Update Bereich (optional)
        $sector_id = trim(strip_tags($_POST['sector']));
        $sector_options = $breitbandconfig_array['sector'];
        $sector = $sector_options[$sector_id];
        if ($userdetails->bereich != $sector && $sector != '') {
            $db->update('users', $userId, ['bereich' => $sector]);
            // PostgreSQL
            $query_profile = "UPDATE bedarfsmeldungen SET bereich = $1 WHERE username = $2;" or die();
            $params_profile = array($sector, $userdetails->username);
            $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
            pg_free_result($result_profile);
            $success_message.= language("PROFILE_SECTOR_UPDATED");
            $success_message.= "<br>";
        }
        //Update telephone (optional)
        $telephone = trim(strip_tags($_POST['telephone']));
        $fields = array('telefon' => $telephone);
        if ($userdetails->telefon != $telephone) {
            if (strlen($telephone) <= 255) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET telefon = $1 WHERE username = $2;" or die();
                $params_profile = array($telephone, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_TELEPHONE_UPDATED");
                $success_message.= "<br>";
            } else {
                $error_message.= language("PROFILE_TELEPHONE_FAILED");
                $error_message.= "<br>";
            }
        }
        //Update further info (optional)
        $further_info = trim(strip_tags($_POST['further-info']));
        $fields = array('weitere' => $further_info);
        if ($userdetails->weitere != $further_info) {
            if (strlen($telephone) <= 500) {
                $db->update('users', $userId, $fields);
                // PostgreSQL
                $query_profile = "UPDATE bedarfsmeldungen SET weitere = $1 WHERE username = $2;" or die();
                $params_profile = array($further_info, $userdetails->username);
                $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
                pg_free_result($result_profile);
                $success_message.= language("PROFILE_FURTHER_INFORMATION_UPDATED");
                $success_message.= "<br>";
            } else {
                $error_message.= language("PROFILE_FURTHER_INFORMATION_FAILED");
                $error_message.= "<br>";
            }
        }
        //Update contact (optional)
        $contact = trim(strip_tags($_POST['contact']));
        if ($contact == "") {
            $contact = 0;
        }
        $fields = array('contact' => $contact);
        if ($userdetails->contact != $contact && ($contact == 0 || $contact == 1)) {
            $db->update('users', $userId, $fields);
            // PostgreSQL
            $contact_postgres = "false";
            if ($contact == 1) {
                $contact_postgres = "true";
            }
            $query_profile = "UPDATE bedarfsmeldungen SET contact = $1 WHERE username = $2;" or die();
            $params_profile = array($contact_postgres, $userdetails->username);
            $result_profile = pg_query_params($dbconn, $query_profile, $params_profile) or die($db_error);
            pg_free_result($result_profile);
            $success_message.= language("PROFILE_CONTACT_UPDATED");
            $success_message.= "<br>";
        }
    }
    pg_close($dbconn);
}
echo $success_message;
echo $error_message;
// mod to allow edited values to be shown in form after update
$user2 = new User();
$userdetails = $user2->data();
//$profile_post_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'] . "#profil";
$profile_post_url = $protocol . $_SERVER['PHP_SELF'] . "#profil";
$token = Token::generate();
session_start();
$_SESSION["custom_profile_token"] = $token;
?>





<div class="row">
    <div class="span3">
    </div>
    <div class="span6">
<h2 id="profile-title" class="form-signin-heading"><?php echo language("PROFILE_UPDATE_TITLE"); ?></h2>
<br>

<?php
echo '<form id="profile-form" name="updateAccount" action="' . $profile_post_url . '" method="post" accept-charset="UTF-8">';
?>

         <br>
        <h3 class="form-signin-heading"><?php echo language("REGISTER_OBLIGATORY_FIELDS"); ?></h3>

        <div class="form-group">
            <label for="profile-salutation"><?php echo language("REGISTER_SALUTATION"); ?>*</label>
            <select id="profile-salutation" class="form-control" name="salutation" required>
                <?php
$salutation_options = $breitbandconfig_array['salutation'];
foreach ($salutation_options as $single_salutation) {
    echo "<option value='" . $single_salutation . "'>" . $single_salutation . "</option>";
}
?>
            </select>
            <script>
                document.getElementById("profile-salutation").value = '<?php echo $userdetails->anrede; ?>';
            </script>
        </div>

        <div class="form-group">
            <label><?php echo language("REGISTER_FIRST_NAME"); ?>*</label>
            <input  class='form-control' type='text' name='fname' value='<?=$userdetails->fname ?>' autocomplete="off" required/>
        </div>

        <div class="form-group">
            <label><?php echo language("REGISTER_LAST_NAME"); ?>*</label>
            <input  class='form-control' type='text' name='lname' value='<?=$userdetails->lname ?>' autocomplete="off" required/>
        </div>

        <div class="form-group">
            <label for="profile-street-number"><?php echo language("REGISTER_STREET_NUMBER"); ?>*</label>
            <input  class="form-control" id="profile-street-number" type="text" name="street-number" required>
        </div>
        <script>
            document.getElementById("profile-street-number").value = '<?php echo $userdetails->strasse; ?>';
        </script>

        <div class="form-group">
            <label for="profile-postcode-area"><?php echo language("REGISTER_POSTCODE_AREA"); ?>*</label>
            <input  class="form-control" id="profile-postcode-area" type="text" name="postcode-area" required>
        </div>
        <script>
            document.getElementById("profile-postcode-area").value = '<?php echo $userdetails->plzort; ?>';
        </script>

    <br>
    <h3 class="form-signin-heading"><?php echo language("REGISTER_ACCOUNT_FIELDS"); ?></h3>
    <div class="form-group">
        <label><?php echo language("LOGIN_USERNAME"); ?></label>
        <?php if (($settings->change_un == 0) || (($settings->change_un == 2) && ($userdetails->un_changed == 1))) { ?>
                                        <div class="input-group">
                                             <input  class='form-control' type='text' name='username' value='<?=$userdetails->username
?>' readonly/>
                                         </div>
        <?php
} else { ?>
                                    <input  class='form-control' type='text' name='username' value='<?=$userdetails->username
?>' autocomplete="off">
        <?php
} ?>
    </div>

    <div class="form-group">
        <label><?php echo language("REGISTER_EMAIL"); ?>*</label>
        <input class='form-control' type='text' name='email' value='<?=$userdetails->email ?>' autocomplete="off" />
                                    <?php if (!IS_NULL($userdetails->email_new)) { ?><br /><div class="alert alert-danger">
                                        <?php echo language("PROFILE_UPDATE_EMAIL_NOTE1"); ?> <?=$userdetails->email_new ?> <?php echo language("PROFILE_UPDATE_EMAIL_NOTE2"); ?>
                                    </div><?php
} ?>
    </div>

                            <div class="form-group">
        <label><?php echo language("PROFILE_VERIFY_EMAIL"); ?>*</label>
        <input class='form-control' type='text' name='confemail' autocomplete="off" />
    </div>

                            <div class="form-group">
                            <label><?php echo language("PROFILE_NEW_PASSWORD"); ?>*</label>
      <div class="input-group" data-container="body">
               <input  class="form-control" type="password" autocomplete="off" name="password" aria-describedby="passwordhelp" autocomplete="off">

      </div></div>

      <div class="form-group">
                                <label><?php echo language("REGISTER_VERIFY_PASSWORD"); ?>*</label>
      <div class="input-group" data-container="body">
              <input  type="password" autocomplete="off" id="confirm" name="confirm" class="form-control" autocomplete="off">
                         </div></div>

                         <div class="form-group">
                                 <label><?php echo language("PROFILE_OLD_PASSWORD_NEEDED"); ?></label>
                                 <div class="input-group" data-container="body">
                                     <input class='form-control' type='password' id="old" name='old' <?php if (is_null($userdetails->password)) { ?>disabled<?php
} ?> autocomplete="off" />

                                 </div>
                         </div>

        <br>
        <h3 class="form-signin-heading"><?php echo language("REGISTER_OPTIONAL_FIELDS"); ?></h3>

        <div class="form-group">
            <label for="profile-organization"><?php echo language("REGISTER_ORGANIZATION"); ?></label>
            <input  class="form-control" id="profile-organization" type="text" name="organization" placeholder="<?php echo language("REGISTER_ORGANIZATION"); ?>">
        </div>
        <script>
            document.getElementById("profile-organization").value = '<?php echo $userdetails->unternehmen; ?>';
        </script>

        <div class="form-group">
            <label for="profile-sector"><?php echo language("REGISTER_SECTOR"); ?></label>
            <select id="profile-sector" class="form-control" name="sector">
                <option class="disabled-selection" value="-1" selected="" disabled=""><?php echo language("REGISTER_SECTOR"); ?></option>
                <?php
$sector_id = - 1;
$sector_options = $breitbandconfig_array['sector'];
foreach ($sector_options as $single_sector_id => $single_sector) {
    echo "<option value='" . $single_sector_id . "'>" . $single_sector . "</option>";
    if ($userdetails->bereich == $single_sector) {
        $sector_id = $single_sector_id;
    }
}
?>
            </select>
            <script>
                document.getElementById("profile-sector").value = '<?php echo $sector_id; ?>';
            </script>
        </div>

        <div class="form-group">
            <label for="profile-telephone"><?php echo language("REGISTER_TELEPHONE"); ?></label>
            <input  class="form-control" id="profile-telephone" type="text" name="telephone">
        </div>
        <script>
            document.getElementById("profile-telephone").value = '<?php echo $userdetails->telefon; ?>';
        </script>

        <div class="form-group">
            <label for="profile-further-info"><?php echo language("REGISTER_FURTHER_INFORMATION"); ?></label>
            <textarea class="form-control" id="profile-further-info" rows="4" cols="50" maxlength="500" name="further-info"></textarea>
        </div>
        <script>
            document.getElementById("profile-further-info").value = '<?php echo $userdetails->weitere; ?>';
        </script>

        <div class="form-group">
            <input type="checkbox" class="form-check-input" id="profile-contact" name="contact" value="1">
            <label id="profile-contact-label" class="register-check-label label-like-url" for="profile-contact"><?php echo language("REPORT_CONTACT"); ?></label>
        </div>
         <script>
            document.getElementById("profile-contact").checked = Number('<?php echo $userdetails->contact; ?>');
        </script>

                         <?php includeHook($hooks, 'form'); ?>
    <input type="hidden" name="csrf" value="<?=$token
?>">
    <input type="hidden" name="profile" value="true">

    <br>
    <p><input class='btn btn-primary' type='submit' value='<?php echo language("PROFILE_UPDATE"); ?>' class='submit' /></p>
</form>



<br>
<!-- Delete account -->
<h2 id="profile-title" class="form-signin-heading">Konto löschen</h2>
<br>
<p>Ihr Konto samt allen Bedarfsmeldungen wird endgültig gelöscht.</p>
<button id="delete-account" type="button" class="btn btn-secondary">Konto löschen</button>


    </div>
    <div class="span3">
    </div>
</div>
                            </div>
                            <!-- My reports -->
                            <div role="tabpanel" class="tab-pane fade in" id="meine-bedarfsmeldungen">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Mein Konto</li>
                                            <li class="breadcrumb-item"><a href="#meine-bedarfsmeldungen" role="tab" data-toggle="tab">Meine Bedarfsmeldungen</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">
                                    <div class="span12">
                                        <h3 id="my-reports-title"><?php echo language("MY_REPORTS_TITLE"); ?></h3>
                                        <div id="my-reports-list"></div>
                                    </div>
                                </div>
                            </div>
                            <?php
                            if (hasPerm([5])) {
                            // TKU
                            ?>
                            <div role="tabpanel" class="tab-pane fade in" id="tku-bedarfsmeldungen">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Mein Konto</li>
                                            <li class="breadcrumb-item"><a href="#tku-bedarfsmeldungen" role="tab" data-toggle="tab">Alle Bedarfsmeldungen</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">
                                    <div class="span12">
                                        <h3 id="tku-reports-title"><?php echo language("TKU_REPORTS_TITLE"); ?></h3>
                                        <div id="tku-reports-list"></div>
                                    </div>
                                </div>
                            </div>
                            <?php
                            }
                            ?>

                            <?php
                            if (hasPerm([2, 4])) {
                            // administrator, admin-bbp
                            ?>
                            <div role="tabpanel" class="tab-pane fade in" id="admin-bedarfsmeldungen">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Mein Konto</li>
                                            <li class="breadcrumb-item"><a href="#admin-bedarfsmeldungen" role="tab" data-toggle="tab">Alle Bedarfsmeldungen - Administrator</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div class="row">
                                    <div class="span12">
                                        <h3 id="admin-reports-title"><?php echo language("ADMIN_REPORTS_TITLE"); ?></h3>
                                        <div id="admin-reports-list"></div>
                                    </div>
                                </div>
                            </div>
                            <?php
                            }
                            ?>

                            <!-- Messages -->
                            <div role="tabpanel" class="tab-pane fade in" id="benachrichtigungen">
                                <!-- Breadcrumb START -->
                                <div class="row row-breadcrumb">
                                    <div class="span10">
                                        <nav class="breadcrumb">
                                          <ul>
                                            <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Mein Konto</li>
                                            <li class="breadcrumb-item"><a href="#benachrichtigungen" role="tab" data-toggle="tab">Benachrichtigungen</a></li>
                                          </ul>
                                        </nav>
                                    </div>
                                </div>
                                <!-- Breadcrumb END -->
                                <div>Es liegen keine Benachrichtigungen vor.</div>
                            </div>
                            <!-- Contact -->
                            <div role="tabpanel" class="tab-pane fade in" id="kontakt">
                            <!-- Breadcrumb START -->
                            <div class="row row-breadcrumb">
                                <div class="span10">
                                    <nav class="breadcrumb">
                                      <ul>
                                        <li class="breadcrumb-item"><a href="index.php" class="breadcrumb-homehaus homehaus start-button"></a></li>
                                        <li class="breadcrumb-item"><a href="#kontakt" role="tab" data-toggle="tab">Kontaktformular</a></li>
                                      </ul>
                                    </nav>
                                </div>
                            </div>
                            <!-- Breadcrumb END -->
                                <div id="contact-row" class="row">
                                    <?php
                                        // RegExp to validate email
                                        function validate_email($email) {
                                            return (!preg_match('/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/', $email)) ? FALSE: TRUE;
                                        }


                                        $contact_error_message = "";
                                        $contact_token_passed = true;
                                        $contact_validate_passed = true;
                                        $contact_captcha_passed = true;
                                        // Receive form data
                                        if (isset($_POST["contact-field"])) {
//                                            session_start();

                                            $get_contact_token = $_POST['csrf'];
                                            if ($get_contact_token != $_SESSION["contact_token"]) {
                                                $contact_token_passed = false;
                                            }

                                            // Captcha
                                            require_once 'php/securimage/securimage.php';
                                            $image = new Securimage();
                                            if ($image->check($_POST['captcha_code']) == true) {
                                              //echo "Correct!";
                                            } else {
                                              //echo "Sorry, wrong code.";
                                              $contact_captcha_passed = false;
                                            }

                                            // Get data
                                            $contact_name = $_POST['contact-name'];
                                            $contact_email = $_POST['contact-email'];
                                            $contact_message = $_POST['contact-message'];
                                            // Sanitize
                                            $contact_name = trim(strip_tags($contact_name));
                                            $contact_email = trim(strip_tags($contact_email));
                                            $contact_message = trim(strip_tags($contact_message));
                                            // Validate
                                            if (!validate_email($contact_email)) {
                                                $contact_error_message .= "Die E-Mail-Adresse ist ungültig.";
                                                $contact_error_message .= "<br>";
                                                $contact_validate_passed = false;
                                            }

                                            if ($contact_validate_passed && $contact_token_passed && $contact_captcha_passed) {
                                                // Send email
                                                $from = "nachricht@breitband.berlin.de";
                                                $to = "breitband@berlin.de";
                                                if ($contact_name) {
                                                    $subject = "Nachricht von " . $contact_name . " (" . $contact_email . ")";
                                                } else {
                                                    $subject = "Nachricht von " . $contact_email;
                                                }
                                                $headers = 'From: ' . $from . "\r\n" . 'Reply-To: ' . $from . "\r\n" . "Content-Type: text/html; charset=utf-8\r\n";
                                                $message = "Name: " . $contact_name . "<br>";
                                                $message .= "E-Mail: " . $contact_email . "<br>";
                                                $message .= "<br>";
                                                $message .= "Nachricht:<br>" . $contact_message;
                                                mail($to, $subject, $message, $headers);
                                                echo "<script>document.getElementById('modal-contact-body').innerHTML = 'Die Nachricht wurde erfolgreich gesendet!';document.getElementById('modal-contact').style.display = 'block';</script>";
                                            }
                                        }

                                        if (!$contact_captcha_passed) {
                                            echo "<script>document.getElementById('modal-contact-body').innerHTML = 'Captcha falsch eingegeben.';document.getElementById('modal-contact').style.display = 'block';</script>";
                                        } elseif (!$contact_validate_passed) {
                                            echo "<script>document.getElementById('modal-contact-body').innerHTML = '" . $contact_error_message . "';document.getElementById('modal-contact').style.display = 'block';</script>";
                                        } elseif (!$contact_token_passed) {
                                            echo "<script>document.getElementById('modal-contact-body').innerHTML = 'Die Nachricht konnte nicht gesendet werden.';document.getElementById('modal-contact').style.display = 'block';</script>";
                                        }

//                                        $contact_post_url = $protocol . $_SERVER['PHP_SELF'] . "#kontakt";
                                        $contact_post_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'] . "#kontakt";
                                        $contact_token = Token::generate();
                                        session_start();
                                        $_SESSION["contact_token"] = $contact_token;
                                    ?>
                                    <div class="span2"></div>
                                    <div id="contact-form-div" class="span8">
                                        <h1 class="title">Kontaktformular</h1>

                                        <p class="help-block">
                                            <strong>Hinweis:</strong>
                                            Dieses Formular enthält Pflichtfelder, die ausgefüllt werden müssen. Pflichfelder sind mit einem "*"-Zeichen markiert.
                                        </p>
                                        
                                        <a href=mailto:breitband@berlin.de> Kontakt per E-Mail </a>
                                        <br>
                                        <br>

                                        <?php echo '<form role="form" enctype="multipart/form-data" class="form-land" id="contact-form" action="' . $contact_post_url . '" method="post" accept-charset="UTF-8">'; ?>
                                            <fieldset class="well">
                                                <!-- Name -->
                                                <div class="control-group">
                                                    <label for="contact-name" class="control-label">Vorname, Name</label>
                                                    <div class="controls">
                                                        <input class="field-type-text" value="" id="contact-name" name="contact-name" type="text">
                                                    </div>
                                                </div>
                                                <!-- E-Mail -->
                                                <div class="control-group">
                                                    <label for="contact-email" class="control-label">E-Mail*</label>
                                                    <div class="controls">
                                                        <input title="Bitte geben Sie eine gültige E-Mail-Adresse ein." class="field-type-email" value="" id="contact-email" name="contact-email" type="text">
                                                    </div>
                                                </div>
                                                <!-- Nachricht -->
                                                <div class="control-group">
                                                    <label for="contact-message" class="control-label">Nachricht</label>
                                                    <div class="controls">
                                                        <textarea onkeydown="if (this.value.length > 2000){this.value = this.value.substring(0,2000); }" rows="10" cols="200" id="contact-message" onkeyup="document.getElementById('contact-message-counter').innerHTML = this.value.length + '/' + this.maxLength + ' Zeichen';" maxlength="2000" name="contact-message" class="maxchars"></textarea>
                                                        <span id="contact-message-counter" class="formcharquota-status" style="display:block;text-align:right;background-color:grey;padding-right:3px;color:white">0/2000 Zeichen</span>
                                                    </div>
                                                </div>

                                                <?php
                                                    // Captcha
                                                    require_once 'php/securimage/securimage.php';
                                                    echo Securimage::getCaptchaHtml();
                                                ?>

                                                <input class='btn pull-right form_submitbutton' type='submit' value='Absenden' class='submit' />

                                                <input type="hidden" name="contact-field" value="true">
                                                <input type="hidden" name="csrf" value="<?=$contact_token ?>">
                                            </fieldset>
                                        </form>

                                    </div>
                                    <div class="span2">
                                    </div>
                                </div>
                            </div>
                            <!-- Single report saved -->
                            <div role="tabpanel" class="tab-pane fade in" id="single-report-saved">
                                <?php echo language("MESSAGE_SINGLE_REPORT_SAVED"); ?>
                            </div>
                            <!-- Email not verified -->
                            <div role="tabpanel" class="tab-pane fade in" id="email-not-verified">
                                <?php echo language("MESSAGE_EMAIL_NOT_VERIFIED"); ?>
                            </div>
                            <!-- Account not verified -->
                            <div role="tabpanel" class="tab-pane fade in" id="account-not-verified">
                                <?php echo language("MESSAGE_ACCOUNT_NOT_VERIFIED"); ?>
                            </div>
                            <!-- Account verified -->
                            <div role="tabpanel" class="tab-pane fade in" id="account-verified">
                                <?php echo language("MESSAGE_ACCOUNT_VERIFIED"); ?>
                            </div>
                            <!-- Email verified -->
                            <div role="tabpanel" class="tab-pane fade in" id="email-verified">
                                <?php echo language("MESSAGE_EMAIL_VERIFIED"); ?>
                            </div>
                            <!-- Report verify after months -->
                            <div role="tabpanel" class="tab-pane fade in" id="report-verify-after-months">
                                <?php echo language("REPORT_VERIFY_AFTER_MONTHS"); ?>
                            </div>
                            <!-- Report verify after months no success -->
                            <div role="tabpanel" class="tab-pane fade in" id="report-not-verify-after-months">
                                <?php echo language("REPORT_VERIFY_AFTER_MONTHS_NO_SUCCESS"); ?>
                            </div>
                            <!-- Forgot password: email sent -->
                            <div role="tabpanel" class="tab-pane fade in" id="forgot-password-sent">
                                <?php echo language("FORGOT_PASSWORD_EMAIL_SENT"); ?>
                            </div>
                            <!-- Forgot password: email not sent -->
                            <div role="tabpanel" class="tab-pane fade in" id="forgot-password-not-sent">
                                <?php echo language("FORGOT_PASSWORD_EMAIL_NOT_SENT"); ?>
                            </div>
                            <!-- Reset password: success -->
                            <div role="tabpanel" class="tab-pane fade in" id="reset-password-success">
                                <?php echo language("RESET_PASSWORD_SUCCESS"); ?>
                            </div>
                            <!-- Reset password: error -->
                            <div role="tabpanel" class="tab-pane fade in" id="reset-password-error">
                                <?php echo language("RESET_PASSWORD_ERROR"); ?>
                            </div>
                            <!-- Reset password -->
                            <div role="tabpanel" class="tab-pane fade in" id="reset-password">
                                        <?php
if (isset($_GET['reset']) && isset($_GET['code']) && isset($_GET['email'])) {
    if ($user->isLoggedIn()) $user->logout();
    $email = Input::get('email');
    $vericode = Input::get('code');
    $ruser = new User($email);
    if ($ruser->data()->vericode != $vericode || (strtotime($ruser->data()->vericode_expiry) - strtotime(date("Y-m-d H:i:s")) <= 0)) {
        echo "Dieser Link ist nicht mehr gültig.";
    } else {
        $reset_password_token = Token::generate();
        session_start();
        $_SESSION["custom_reset_password_token"] = $reset_password_token;
?>
                                <div class="row">
                                    <div class="span3">
                                    </div>
                                    <div class="span6">

                                        <h2 class="text-center"><?=$ruser->data()->fname; ?></h2>
                                        <p class="text-center">Bitte setzen Sie Ihr Passwort zurück</p>
                                        <form action="php/reset-password.php?reset=1" method="post">
                                            <div class="form-group">
                                                <label for="password">Neues Passwort (6-30 Zeichen):</label>
                                                <input type="password" name="password" value="" id="form-reset-password" class="form-control" autocomplete="new-password">
                                            </div>
                                            <div class="form-group">
                                                <label for="confirm">Passwort bestätigen:</label>
                                                <input type="password" name="confirm" value="" id="form-confirm-reset-password" class="form-control" autocomplete='new-password'>
                                            </div>
                                            <input type="hidden" name="csrf" value="<?=$reset_password_token; ?>">
                                            <input type="hidden" name="email" value="<?=$email; ?>">
                                            <input type="hidden" name="vericode" value="<?=$vericode; ?>">
                                            <input type="submit" name="resetPassword" value="Zurücksetzen" class="btn btn-primary">
                                        </form>

                                    </div>
                                    <div class="span3">
                                    </div>

                                </div>
                                <?php
    }
}
?>
                            </div>

                        </div>

                        <div class="section_splitter"></div>
                        <!-- PARTNER -->
                        <div class="html5-section block modul-logogalerie">
                            <div class="html5-header header">
                                <h3 class="title">Partner</h3>
                            </div>
                            <div class="html5-section body">
                                <div class="list-partnerlogos">
                                    <div class="logogalerie-item">
                                        <div class="html5-figure image ">
                                            <a title="Link zu: Breitband-Kompetenz-Team Berlin" class='logo-accessibility' href="https://projektzukunft.berlin.de/news/news-detail/breitband-kompetenz-team-berlin" target="_blank">
                                                <img title="Link zu: Breitband-Kompetenz-Team Berlin" alt="Bild zeigt: Logo von Breitband-Kompetenz-Team Berlin" src="img/BKT.jpg">
                                            </a>
                                        </div>
                                    </div>
                                    <div class="logogalerie-item">
                                        <div style="" class="html5-figure image ">
                                            <a title="Link zu: Senatsverwaltung für Wirtschaft, Energie und Betriebe" class='logo-accessibility' href="https://www.berlin.de/sen/web" target="_blank">
                                                <img title="Link zu: Senatsverwaltung für Wirtschaft, Energie und Betriebe" alt="Bild zeigt: Logo von Senatsverwaltung für Wirtschaft, Energie und Betriebe" src="img/SenWEB.jpg">
                                            </a>
                                        </div>
                                    </div>
                                    <div class="logogalerie-item">
                                        <div class="html5-figure image ">
                                            <a title="Link zu: IHK Berlin" class='logo-accessibility' href="https://www.ihk-berlin.de/" target="_blank">
                                                <img title="Link zu: IHK Berlin" alt="Bild zeigt: Logo von IHK Berlin" src="img/IHK.png">
                                            </a>
                                        </div>
                                    </div>
                                    <div class="logogalerie-item">
                                        <div class="html5-figure image ">
                                            <a title="Link zu: geoSYS" class='logo-accessibility' href="http://geosysnet.de/#" target="_blank">
                                                <img title="Link zu: geoSYS" alt="Bild zeigt: Logo von geoSYS" src="img/geoSYS.png">
                                            </a>
                                        </div>
                                    </div>
                                    <p id='logo-text-accessibility'>Partner des Berliner Breitband Portals sind das „Breitband-Kompetenz-Team Berlin", die „Senatsverwaltung für Wirtschaft, Energie und Betriebe", die „Industrie - und Handelskammer zu Berlin" und „geoSYS". </p>
                                </div>
                            </div>
                        </div>


                        <!-- FOOTER -->
                        <!-- CONTENT -->
                        <!--    container-wrapper + container + row + span12 -->
                        <div class="row">
                            <div class="span12">
                                <div class="html5-footer content-footer" role="contentinfo">
                                    <div class="html5-nav">
                                        <ul class="nav">
                                            <li><a href="#impressum" id="impressum-button" class="ic-fa-impressum" role="tab" data-toggle="tab"><?php echo language("FOOTER_ABOUT"); ?></a></li>
                                            <li><a href="#kontakt" class="ic-fa-mail contact-button" role="tab" data-toggle="tab"><?php echo language("FOOTER_CONTACT"); ?></a></li>
                                            <li><a href="#datenschutz" class="ic-fa-lock datenschutz-button" role="tab" data-toggle="tab"><?php echo language("FOOTER_DATA_PROTECTION"); ?></a></li>
                                            <li><a href="#barrierefreiheit" class="barrierefreiheit-button" role="tab" data-toggle="tab"><img src='./img/accessibility.png' style='width:20px'> <?php echo language("FOOTER_ACCESSIBILITY"); ?></a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
        <!-- MOBILE NAVIGATION START -->
        <div class="navigation-mobile hidden-desktop hidden-tablet" role="navigation">
            <p class="navSkip">Navigiere direkt zu:</p>
            <ul class="navSkip">
                <li>
                    <a href="#mobile-nav-toggle" tabindex="1" id="hiddenNavToggler">
                        Navigation <!-- append text per css here -->
                    </a>
                </li>
            </ul>
            <button class="btn nav-toggle" id="mobile-nav-toggle" title="Mobile Navigation" aria-labelledby="hiddenNavToggler">
            <span class="aural">Öffnet und schließt die mobile Navigation</span>
            <span class="icon-menu">
            <span class="line line-1"></span>
            <span class="line line-2"></span>
            <span class="line line-3"></span>
            </span>
            </button>
            <div class="wrapper">
                <div class="nav-container">
                    <div class="nav-container-body">
                        <ul class="nav-menu menu">
                            <li class="menu-item has-dropdown is-active ">
                                <a href="#" class="menu-link">Berliner Breitband Portal</a>
                                <!-- HIER 0 -->
                                <ul class="nav-dropdown menu is-visible ">
                                    <li class="menu-item">
                                        <ul class="nav">
                                            <li class="menu-item mobile-button">
                                                <a class="menu-link" href="#start" role="tab" data-toggle="tab"><?php echo language("INDEX_START_TITLE"); ?></a>
                                            </li>
                                            <li class="menu-item mobile-button">
                                                <a class="menu-link" href="#bedarfskarte" role="tab" data-toggle="tab"><?php echo language("INDEX_VIEWER_TITLE"); ?></a>
                                            </li>
                                            <li class="menu-item mobile-button" id="report-tab-mobile-button">
                                                <a class="menu-link" href="#bedarfsmeldung" role="tab" data-toggle="tab"><?php echo language("INDEX_REPORT_TITLE"); ?></a>
                                            </li>
                                            <li class="menu-item mobile-button has-submenu">
                                                <a class="menu-link" href="#forum" role="tab" data-toggle="tab"><?php echo language("INDEX_FORUM_TITLE"); ?></a>
                                                <ul class="sub level-1 submenu">
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-archive" role="tab" data-toggle="tab">Archiv</a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-provider" role="tab" data-toggle="tab">Anbieter</a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-technology" role="tab" data-toggle="tab">Technologien</a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-supply" role="tab" data-toggle="tab">Breitbandversorgung</a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-infos" role="tab" data-toggle="tab">Weitere Informationen</a>
                                                    </li>
                                                    <?php
                                                    // Only for Admins
                                                    if (hasPerm([2, 4])) {
                                                    ?>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#forum-ihk" role="tab" data-toggle="tab">IHK</a>
                                                    </li>
                                                    <?php
                                                    }
                                                    ?>
                                                </ul>
                                            </li>

                                            <!--
                                            <li class="menu-item mobile-button">
                                                <a class="menu-link" href="#faq" role="tab" data-toggle="tab"><?php echo language("INDEX_FAQ_TITLE"); ?></a>
                                            </li>-->

                                            <li class="menu-item mobile-button has-submenu">
                                                <a class="menu-link" href="#help" role="tab" data-toggle="tab"><?php echo language("INDEX_HELP_TITLE"); ?></a>
                                                <ul class="sub level-1 submenu">
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link help-link" href="#help-faq" role="tab" data-toggle="tab">FAQ</a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link help-link" href="#help-glossar" role="tab" data-toggle="tab">Glossar</a>
                                                    </li>
                                               
                                                </ul>
                                            </li>
                                           
                                            <?php
if (!$user->isLoggedIn()) {
?>
                                            <li class="menu-item mobile-button">
                                                <!-- <a class="menu-link" href="login.php"><?php echo language("INDEX_LOGIN_TITLE"); ?></a> -->
                                                <a class="menu-link" href="#konto" role="tab" data-toggle="tab"><?php echo language("INDEX_LOGIN_TITLE"); ?></a>
                                            </li>
                                            <?php
} else {
?>
                                            <li class="menu-item has-submenu">
                                                <a class="menu-link" href="#"><?php echo language("PROFILE_LOGOUT_TITLE"); ?></a>
                                                <ul class="sub level-1 submenu">
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#profil" role="tab" data-toggle="tab"><?php echo language("PROFILE_TITLE"); ?></a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#meine-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("MY_REPORTS_TITLE"); ?></a>
                                                    </li>
                                                    <?php
                                                    if (hasPerm([5])) {
                                                    // TKU Reports
                                                    ?>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#tku-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("TKU_REPORTS_TITLE"); ?></a>
                                                    </li>
                                                    <?php
                                                    }
                                                    ?>
                                                    <?php
                                                    if (hasPerm([2, 4])) {
                                                    // Admin Reports
                                                    ?>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#admin-bedarfsmeldungen" role="tab" data-toggle="tab"><?php echo language("ADMIN_REPORTS_TITLE"); ?></a>
                                                    </li>
                                                    <?php
                                                    }
                                                    ?>
                                                    <li class="menu-item mobile-button has-no-dropdown">
                                                        <a class="menu-link" href="#benachrichtigungen" role="tab" data-toggle="tab"><?php echo language("MESSAGES_TITLE"); ?></a>
                                                    </li>
                                                    <li class="menu-item mobile-button has-no-dropdown logout-mobile-button">
                                                        <a href="logout.php"><?php echo language("INDEX_LOGOUT_TITLE"); ?></a>
                                                    </li>
                                                </ul>
                                            </li>
<?php
}
?>
                                            <?php
                                            // Only for Admins
                                            if (hasPerm([2, 4])) {
                                            ?>
                                            <li class="menu-item mobile-button has-no-dropdown">
                                                <a class="menu-link" href="#video-upload" role="tab" data-toggle="tab">Videos</a>
                                            </li>
                                            <?php
                                            }
                                            ?>
                                        </ul>
                                    </li>
                                </ul>
                            <li class="menu-item has-dropdown">
                                <a href="#!" class="menu-link">Berlin.de</a>
                                <ul class="nav-dropdown menu">
                                    <li class="menu-item visible">
                                        <ul class="nav">
                                            <li class=" menu-item visible">
                                                <a href="https://www.berlin.de/politik-verwaltung-buerger/" target="_blank" class="menu-link">Politik, Verwaltung, Bürger</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/kultur-und-tickets/" target="_blank" class="menu-link">Kultur &amp; Ausgehen</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/tourismus/" target="_blank" class="menu-link">Tourismus</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/wirtschaft/" target="_blank" class="menu-link">Wirtschaft</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/special/" target="_blank" class="menu-link">Lifestyle</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/adressen/" target="_blank" class="menu-link">BerlinFinder</a>
                                            </li>
                                            <li class=" menu-item">
                                                <a href="https://www.berlin.de/stadtplan/" target="_blank" class="menu-link">Stadtplan</a>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                                <!-- class="sub level-1" -->
                            </li>
                            <!-- crumbs1 -->
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <!-- MOBILE NAVIGATION END -->
        <div class="container-wrapper container-footer">
            <div class="container">
                <div class="row">
                    <div class="span12">
                        <!-- template start: portal-footer -->
                        <!-- /template end: portal-footer -->
                    </div>
                </div>
            </div>
        </div>
        <script>
            let status = 'anonymous';
            status =
            <?php
// Pass user status to javascript
if ($user->isLoggedIn()) {
    if (hasPerm([2, 4], $user->data()->id)) {
        // administrator or admin-bbp
        echo json_encode('admin');
    } else if (hasPerm([3], $user->data()->id)) {
        // intern-bbp
        echo json_encode('intern');
    } else if (hasPerm([5], $user->data()->id)) {
          // tku-bbp
          echo json_encode('tku');
    } else if (hasPerm([1], $user->data()->id)) {
        // user-bbp
        echo json_encode('user');
    }
} else {
    // anonymous
    echo json_encode('anonymous');
}
?>;
            window.language =
            <?php
echo json_encode($l);
?>;
            window.wofisUrl =
            <?php
            // WoFIS URL
            if ($user->isLoggedIn()) {
                if (hasPerm([2, 4, 5], $user->data()->id)) {
                    // administrator or admin-bbp or tku-bbp
                    echo json_encode('bbp-berlin:wofis');
                } else {
                    echo json_encode('');
                }
            } else {
                // anonymous
                echo json_encode('');
            }
            ?>;
        </script>
        <?php
$webpack_manifest = file_get_contents("./manifest.json");
$js_files = json_decode($webpack_manifest, true);
echo "<script src=" . $js_files["app.js"] . "></script>";
?>

    <div id="ajax-loader" class="" role="status">
         <img src="img/ajax-loader.gif">
    </div>


    </body>
</html>
