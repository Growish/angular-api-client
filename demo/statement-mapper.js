app.factory('statementMapper', function () {

    var money = function (amount) {
        var decimal = Math.floor(100 * ((amount / 100) % 1).toFixed(2));
        if(String(decimal).length === 1)
            decimal = "0" + String(decimal);

        return Math.floor(amount / 100) + ".<small>" + decimal + "</small> €"
    };

    return {
        in: function (statement) {

            var formatStatement = [];

            for(var i = 0; i < statement.length; i++) {

                var title = "";
                var subTitle = "";
                var extraLine = "";
                var symbol = 1;

                //LEGACY FIX
                if(typeof statement[i].fee == 'undefined')
                    statement[i].fee = 0;

                //AGENCY TRANSFERS ARE SKIPPED
                // if(statement[i].type == 'transfer')
                //     continue;

                if(statement[i].operation == 'cashout') {

                    symbol = -1;

                    if (statement[i].type == 'transfer') {
                        title = 'Trasferimento verso l\'Agenzia';
                        subTitle = 'per acconto importo del Viaggio'
                    }

                    if (statement[i].type == 'withdrawal') {

                        title = 'Richiesta di Bonifico';
                        subTitle = 'verso <strong>' + statement[i].iban + '</strong>';

                        //WITHDRAWAL CASH OUT IN PENDING
                        if (statement[i].status == 'waiting') {
                            extraLine = 'Richiesta inviata alla banca';
                        }
                        //WITHDRAWAL CASH OUT APPROVED
                        else if (statement[i].status == 'done') {
                            extraLine = 'Richiesta ricevuta dalla banca';
                        }


                    }

                    //USER BUYS WITH PAY APP
                    else if (statement[i].type == 'transfer_user_partner') {
                        title = "Trasferimento presso Negozio";
                        subTitle = 'verso <strong>' + statement[i].partnerName + ' (' + statement[i].partnerEmail + ')</strong>';
                    }

                    //USER BUYS VOUCHER
                    else if (statement[i].type == 'product-acquisition') {
                        title = "Acquisto prodotto tramite lista";
                    }

                    //USER BUYS PREMIUM PRODUCTS
                    else if (statement[i].type == 'premium-acquisition') {
                        title = "Acquisto servizi premium tramite lista";
                        extraLine = "numero ordine: <strong>" + statement[i].order + "</strong>";
                    }

                }

                else if(statement[i].operation == 'cashin') {

                    //CREDIT CARD CASH IN
                    if(statement[i].type == 'card') {
                        title = "Versamento con carta di credito";
                        subTitle = "Importo: <strong>" + money(statement[i].amount) + "</strong> | Costo servizio: <strong>" + money(statement[i].fee) + "</strong>";
                        extraLine = "Da: <strong>" + statement[i].issuedBy + "</strong>";
                    }

                    else if(statement[i].type == 'withdrawal') {
                        title = "Versamento con bonifico";
                        subTitle = "Importo: <strong>" + money(statement[i].amount) + "</strong> | Costo servizio: <strong>" + money(statement[i].fee) + "</strong>";

                        //WITHDRAWAL CASH IN PENDING
                        if(statement[i].status == 'waiting') {
                            extraLine = "Da: <strong>" + statement[i].issuedBy + "</strong> | Stato: <strong>Promessa</strong>";
                        }
                        //WITHDRAWAL CASH IN APPROVED
                        else if(statement[i].status == 'done') {
                            extraLine = "Da: <strong>" + statement[i].issuedBy + "</strong> | Stato: <strong>Approvato</strong>";
                        }

                    }

                    //TRANSFER FROM AGENCY TO USER
                    else if(statement[i].type == 'transfer_from_agency') {
                        title = "Trasferimento dall'Agenzia";
                        subTitle = "Incasso successivo al saldo Viaggio";

                        if (statement[i].status == 'waiting') {
                            extraLine = "<strong>In attesa</strong>"
                        }
                    }

                    else if(statement[i].type == 'cash') {

                        title = "Versamento in Agenzia";
                        subTitle = "Importo: <strong>" + money(statement[i].amount + statement[i].fee) + "</strong> | Costo servizio: <strong>" + money(statement[i].fee) + "</strong>";

                        //CASH CASH IN PENDING
                        if(statement[i].status == 'waiting') {
                            extraLine = "Da: <strong>" + statement[i].issuedBy + "</strong> | Stato: <strong>Promessa</strong>";
                        }
                        //CASH CASH IN APPROVED
                        else if(statement[i].status == 'done') {
                            extraLine = "Da: <strong>" + statement[i].issuedBy + "</strong> | Stato: <strong>Approvato</strong>";
                        }
                    }

                    else if(statement[i].type == 'deposit') {
                        title = "Versamento in agenzia";
                        switch (parseInt(statement[i].reason)) {
                            case 0:
                                subTitle = "Acconto importo Viaggio da parte degli sposi";
                                break;
                            case 1:
                                subTitle = "Saldo importo Viaggio da parte degli sposi";
                                break;
                            //FOR LEGACY
                            case 2:
                                subTitle = "Saldo/Acconto Viaggio da parte degli sposi";
                                break;
                        }
                    }

                    else if(statement[i].type == 'manual_transfer') {
                        title = "Trasferimento dall'Agenzia";
                        subTitle = 'Incasso successivo al saldo Viaggio';

                        extraLine = '<strong>Restituzione diretta agli sposi<strong>';
                    }

                }


                formatStatement.push({
                    title: title,
                    subTitle: subTitle,
                    extraLine: extraLine,
                    type: statement[i].type,
                    status: statement[i].status,
                    amount: (typeof statement[i].netAmount != 'undefined') ? (symbol * statement[i].netAmount) : (symbol * statement[i].amount),
                    creationDate: {
                        year: moment(statement[i].updateDate, 'YYYY-MM-DD hh:mm:ss').format('YYYY'),
                        month: moment(statement[i].updateDate, 'YYYY-MM-DD hh:mm:ss').format('MMM'),
                        day: moment(statement[i].updateDate, 'YYYY-MM-DD hh:mm:ss').format('DD')
                    }
                });
            }

            return formatStatement;

        },
        out: function (statement) {
            return statement;
        }
    }

});