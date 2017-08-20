$("#invoice-check").change(function(){
  if(this.checked)
    $(".invoiced-entity").show()
  else
    $(".invoiced-entity").hide()
  setGrandTotal()
  updateInvoicenumber()
});

var newItemHtml = `
<div class="item">
  <input type="text" placeholder="Item Code" class="col-sm-2 item-code"/>
  <input type="text" placeholder="Item" class="col-sm-2 item-description"/>
  <input type="number" placeholder="Weight" class="col-sm-2 item-weight" min="0"/>
  <input type="number" placeholder="Cost per gram" class="col-sm-2 cost-per-gram" min="0"/>
  <input type="number" placeholder="HSN" class="col-sm-1 hsn-code" value="7113" disabled/>
  <input type="number" placeholder="Discount" class="col-sm-2 item-discount" min="0"/>
  <span class="col-sm-1 text-right item-total">0</span>
</div>
`

var incompleteDataWarningHtml = `
<div id="incomplete-details-warning" class="alert alert-danger navbar navbar-fixed-top">
  <strong>Incomplete details.</strong>
  <button type="button" class="close" data-dismiss="alert">&times;</button>
</div>
`

$("#add-item-row").on("click", function(){
  $("#items").append(newItemHtml)
});


$("#remove-last-item-row").on("click", function(){
  var itemClassed = $(".item")
  itemClassed.last().remove()
});

$("#gst-type-check").change( function(){
  if(this.checked){
    $("#cgst-rate").text("1.5")
    $("#sgst-rate").text("1.5")
    $("#igst-rate").text("0.0")
  } else {
    $("#cgst-rate").text("0.0")
    $("#sgst-rate").text("0.0")
    $("#igst-rate").text("3.0")
  }
  setGst()
  setGrandTotal()
})

$("#items").change(function(){
  setItemTotalAndSubTotal()
  setGst()
  setGrandTotal()
})

$("#copy-billing-address").on("click", function(){
  $("#shipping-customer-name").val($("#billing-customer-name").val())
  $("#shipping-address").val($("#billing-address").val())
  $("#shipping-state-pin").val($("#billing-state-pin").val())
  $("#shipping-phone-number").val($("#billing-phone-number").val())
  $("#shipping-gstin").val($("#billing-gstin").val())
})

$(document).ready(function(){
  $("#date").val(moment().format('YYYY-MM-DD'))
  $(".invoiced-entity").hide()
  updateInvoicenumber()
})

var toBeInvoiced = function() {
  return $("#invoice-check").is(":checked")
}

var updateInvoicenumber = function() {
  if (toBeInvoiced()) {
    updateLatestInvoiceNumber()
  }
  else {
    $("#tax-invoice-number").text("nil")
  }
}

var updateLatestInvoiceNumber = function() {
  var ref=firebase.database().ref("/billed-invoices/").orderByKey().limitToLast(1)
  ref.once('value', function(x){
    var newInvoiceNumber;
    if(x.val()) {
      newInvoiceNumber = parseInt(Object.keys(x.val())[0]) + 1;
    } else {
      newInvoiceNumber = 10001;
    }
    $("#tax-invoice-number").text(newInvoiceNumber)
  })
}

var setItemTotalAndSubTotal = function() {
  $(".item").each(function(){
    var weight=$(this).find('.item-weight').val()
    var costPerGram=$(this).find('.cost-per-gram').val()
    var discount=$(this).find('.item-discount').val()
    $(this).find('.item-total').text(rO2Ds(weight*costPerGram - discount))
  })
  var subTotal=0.0;
  $(".item").each(function(){
  	subTotal+=parseFloat($(this).find('.item-total').text())
  })
  $("#sub-total").text(rO2Ds(subTotal))
}

var setGst=function() {
  var subTotal=parseFloat($("#sub-total").text())
  var cgstAndSgst=$("#gst-type-check").is(":checked")

  if(cgstAndSgst) {
    var tax=rO2Ds(subTotal*0.015)
    $("#cgst").text(tax)
    $("#sgst").text(tax)
    $("#igst").text(0)
  } else {
    var tax=rO2Ds(subTotal*0.03)
    $("#cgst").text(0)
    $("#sgst").text(0)
    $("#igst").text(tax)
  }

}

var setGrandTotal = function() {
  var total=0.0;
  var subTotal=parseFloat($("#sub-total").text())

  total+=subTotal
  if (toBeInvoiced())
    total+=parseFloat($("#cgst").text())+parseFloat($("#sgst").text())
    +parseFloat($("#igst").text())
  $("#grand-total").text(Math.round(total))
  var rounfOffFactor=rO2Ds(Math.round(total)-rO2Ds(total))
  $("#round-off").text(rounfOffFactor)
}

var rO2Ds = function(n) {
  return Math.round(n*100)/100
}

var allFieldsFilled = function() {
  return $("input").toArray().every(function(e){
    return $(e).val()!=''
  })
}

var showIncompleteFieldsWarning = function() {
  if($("#incomplete-details-warning")[0])
    ;
  else
    $("body").append(incompleteDataWarningHtml)
}

var uploadToFirebase =  function() {
  var ref1=firebase.database().ref("/all-invoices/").orderByKey().limitToLast(1)
  ref1.once('value', function(x){
    var newSerial;
    var currentInvoiceNumber = $("#tax-invoice-number").text();
    if(x.val()) {
      newSerial= parseInt(Object.keys(x.val())[0]) + 1;
    } else {
      newSerial=1;
    }
    firebase.database().ref("/all-invoices/"+newSerial).set(generateJson())
    if(toBeInvoiced())
      firebase.database().ref("/billed-invoices/"+currentInvoiceNumber).set(newSerial)
  })
}

$("#create-entry").on("click",function(){
  if(!allFieldsFilled()) {
    showIncompleteFieldsWarning()
    return;
  }
  uploadToFirebase()
})

var generateJson = function() {
  var invoiceDetails = {}
  invoiceDetails.date = $("#date").val()
  invoiceDetails.billingAddress = {
    name : $("#billing-customer-name").val(),
    address : $("#billing-address").val(),
    stateAndPin : $("#billing-state-pin").val(),
    phoneNumber : $("#billing-phone-number").val(),
    gstin : $("#billing-gstin").val()
  }
  invoiceDetails.shippingAddress = {
    name : $("#shipping-customer-name").val(),
    address : $("#shipping-address").val(),
    stateAndPin : $("#shipping-state-pin").val(),
    phoneNumber : $("#shipping-phone-number").val(),
    gstin : $("#shipping-gstin").val()
  }
  invoiceDetails.items = []
  $(".item").each(function(){
    var item = {}
    item.code=$(this).find('.item-code').val()
    item.description=$(this).find('.item-description').val()
    item.weight=$(this).find('.item-weight').val()
    item.costPerGram=$(this).find('.cost-per-gram').val()
    item.discount=$(this).find('.item-discount').val()
    item.hsn=$(this).find('.hsn-code').val()
    item.total=$(this).find('.item-total').text()
    invoiceDetails.items.push(item)
  })

  invoiceDetails.subTotal = $("#sub-total").text()
  if(toBeInvoiced()) {
    var paymentMode = $("#payment-mode")

    invoiceDetails.paymentMode = paymentMode.attr(paymentMode.prop('checked')+'')
    invoiceDetails.invoiceNumber = $("#tax-invoice-number").text()
    invoiceDetails.cgst = $("#cgst").text()
    invoiceDetails.sgst = $("#sgst").text()
    invoiceDetails.igst = $("#igst").text()
  }
  invoiceDetails.roundoff = $("#round-off").text()
  invoiceDetails.total = $("#grand-total").text()
  return invoiceDetails;
}
