
var modal = $("#myModal")[0];


var invoiceDetails = {"billingAddress":{"address":"-","gstin":"-","name":"_","phoneNumber":"-","stateAndPin":"-"},"cgst":"0.03","date":"2017-08-24","igst":"0","invoiceNumber":"10001","items":[{"code":"1","costPerGram":"2","description":"Ring","discount":"0","hsn":"7113","total":"2","weight":"1"}],"paymentMode":"Cash","roundoff":"-0.06","sgst":"0.03","shippingAddress":{"address":"-","gstin":"-","name":"_","phoneNumber":"-","stateAndPin":"-"},"subTotal":"2","total":"2"}

const Item = ({ description, weight, costPerGram, hsn, discount, total }) => `
<tr>
  <td class="serial">${++window.serial || (window.serial=1)}</td>
  <td class="item">${description}</td>
  <td class="weight">${weight}</td>
  <td class="cost-per-gram">₹${costPerGram}</td>
  <td class="hsn-code">${hsn}</td>
  <td class="discount">${discount}</td>
  <td class="taxable-total">₹${total}</td>
</tr>
`;

$("#logo").click(_=>{
    modal.style.display = "block";
})

$(".close").click(_=>{
    modal.style.display = "none";
})

$(window).click(event=>{
    if (event.target == modal) {
        modal.style.display = "none";
    }
})

$(document).ready(_=>{
  $("#logo").click()
})

$("#load-invoice").click(event=>{
  performFirebaseAction()
})

var performFirebaseAction = function(){
  var invoiceNumber = $("#invoice-number").val()
  var firebaseDb = firebase.database();
  firebaseDb.ref("/billed-invoices/"+invoiceNumber).once("value", function(billedInvoice){
    if(billedInvoice.val())
      firebaseDb.ref("/all-invoices/"+billedInvoice.val()).once("value", function(invoice){
        var invoiceJSON=invoice.val()
        fillDataIntoInvoice(invoiceJSON)
      })
  })
}


var fillDataIntoInvoice = function(invoiceJSON) {
  modal.style.display="none";
  $("#date").text(moment(invoiceJSON.date).format('DD MMMM YYYY'))
  $("span#invoice-number").text(invoiceJSON.invoiceNumber)
  $("span#payment-mode").text(invoiceJSON.paymentMode)

  $("#shipping-customer-name").text(invoiceJSON.billingAddress.name)
  $("#shipping-address").text(invoiceJSON.billingAddress.address)
  $("#shipping-state-pin").text(invoiceJSON.billingAddress.stateAndPin)
  $("#shipping-phone-number").text(invoiceJSON.billingAddress.phoneNumber)
  $("#shipping-gstin").text(invoiceJSON.billingAddress.gstin)

  $("#billing-customer-name").text(invoiceJSON.shippingAddress.name)
  $("#billing-address").text(invoiceJSON.shippingAddress.address)
  $("#billing-state-pin").text(invoiceJSON.shippingAddress.stateAndPin)
  $("#billing-phone-number").text(invoiceJSON.shippingAddress.phoneNumber)
  $("#billing-gstin").text(invoiceJSON.shippingAddress.gstin)

  var invoiceParticularsHtml=invoiceJSON.items.map(Item).join('')
  $(".particulars").prepend(invoiceParticularsHtml)
  $("#total-taxable-amount").text(invoiceJSON.subTotal)

  $("#cgst").text(invoiceJSON.cgst)
  $("#sgst").text(invoiceJSON.sgst)
  $("#igst").text(invoiceJSON.igst)

  $("#cgst-rate").text(invoiceJSON.igst=="0"?"1.5":"0")
  $("#sgst-rate").text(invoiceJSON.igst=="0"?"1.5":"0")
  $("#igst-rate").text(invoiceJSON.igst=="0"?"0":"3")

  $("#round-off").text(invoiceJSON.roundoff)
  $("#grand-total").text(invoiceJSON.total)
  $("#grand-total-in-words").text(convertNumberToWords(invoiceJSON.total))
}

function convertNumberToWords(amount) {
    var words = new Array();
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';
    amount = amount.toString();
    var atemp = amount.split(".");
    var number = atemp[0].split(",").join("");
    var n_length = number.length;
    var words_string = "";
    if (n_length <= 9) {
        var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
        var received_n_array = new Array();
        for (var i = 0; i < n_length; i++) {
            received_n_array[i] = number.substr(i, 1);
        }
        for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
            n_array[i] = received_n_array[j];
        }
        for (var i = 0, j = 1; i < 9; i++, j++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                if (n_array[i] == 1) {
                    n_array[j] = 10 + parseInt(n_array[j]);
                    n_array[i] = 0;
                }
            }
        }
        value = "";
        for (var i = 0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                value = n_array[i] * 10;
            } else {
                value = n_array[i];
            }
            if (value != 0) {
                words_string += words[value] + " ";
            }
            if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Crores ";
            }
            if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Lakhs ";
            }
            if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Thousand ";
            }
            if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                words_string += "Hundred and ";
            } else if (i == 6 && value != 0) {
                words_string += "Hundred ";
            }
        }
        words_string = words_string.split("  ").join(" ");
    }
    return words_string;
}
