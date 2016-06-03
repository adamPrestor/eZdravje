
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
var generirajPodatke = function (stPacienta, callback) {
  var ehrId = "";
  var sessionId = getSessionId();
  
  var ime;
  var priimek;
  var datumRojstva;
  var telesnaTeza;
  var telesnaVisina;
  var telesnaVrocina;
  var nasicenostKisika;
  var diastolicniKrvniTlak;
  var sistolicniKrvniTlak;
  
  if(stPacienta == 1) {
      ime = "Franci";
      priimek = "Riba";
      datumRojstva = "1964-11-21T11:40Z";
      telesnaTeza = 80;
      telesnaVisina = 170;
      telesnaVrocina = 36.5;
      nasicenostKisika = 98;
      diastolicniKrvniTlak = 90;
      sistolicniKrvniTlak = 110;
  } else if(stPacienta == 2) {
      ime = "Jakob";
      priimek = "Vroci";
      datumRojstva = "1973-10-13T12:00Z";
      telesnaVisina = 181;
      telesnaTeza = 72;
      telesnaVrocina = 39.5;
      nasicenostKisika = 90;
      diastolicniKrvniTlak = 80;
      sistolicniKrvniTlak = 100;
  } else if(stPacienta == 3) {
      ime = "Joze";
      priimek = "Krvnik";
      datumRojstva = "1980-02-10T09:15Z";
      telesnaTeza = 63;
      telesnaVisina = 165;
      telesnaVrocina = 36.8;
      nasicenostKisika = 80;
      diastolicniKrvniTlak = 85;
      sistolicniKrvniTlak = 105;
  }
  
  $.ajaxSetup({
     headers: {
         "Ehr-Session": sessionId
     }
  });
  $.ajax({
      url: baseUrl + "/ehr",
      type: 'POST',
      success: function (data) {
          var ehrId = data.ehrId;
          
          var partyData = {
              firstNames: ime,
              lastNames: priimek,
              dateOfBirth: datumRojstva,
              partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
          };
          $.ajax({
              url: baseUrl + "/demographics/party",
              type: 'POST',
              contentType: 'application/json',
              data: JSON.stringify(partyData),
              success: function (party) {
                  if(party.action == 'CREATE') {
                    var podatki = {
                          "ctx/language": "en",
                          "ctx/territory": "SI",
                          "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                          "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                          "vital_signs/body_temperature/any_event/temperature|magnitude": telesnaVrocina,
                          "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                          "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                          "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                          "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKisika
                      }
                      var parametriZahteve = {
                          ehrId: ehrId,
                          templateId: 'Vital Signs',
                          format: 'FLAT',
                      };
                      $.ajaxSetup({
                         headers: {
                             "Ehr-Session": sessionId
                         }
                      });
                      $.ajax({
                          url: baseUrl + "/composition?" + $.param(parametriZahteve),
                          type: 'POST',
                          contentType: 'application/json',
                          data: JSON.stringify(podatki),
                          success: function(res) {
                              callback(ehrId, ime, priimek);
                          },
                          error: function(err) {
                              console.log(err);
                          }
                      });
                  }
              },
              error: function (err) {
                  console.log("NI SLO");
              }
          });
      }
  });
};

var vrniPodatkePacienta = function(ehrId, callback) {
  var sessionId = getSessionId();
  
  console.log(ehrId);
  
  $.ajax({
      url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
      type: 'GET',
      headers: {"EHR-Session": sessionId},
      success: function(data) {
          var party = data.party;
          $("#vrniIme").val(party.firstNames);
          $("#vrniPriimek").val(party.lastNames);
          $("#vrniDatum").val(party.dateOfBirth);
          $("#vrniEhrId").val(ehrId);
      },
      error: function(err) {
          $("#poizvedbaSporocilo").html("Podatke za "+ ehrId+" ni mogoce posredovati.");
      }
  });
};

$(document).ready(function() {
    $("#generator").click(function(event) {
        document.getElementById("seznamBolnikov").innerHTML = "";
        generirajPodatke(1, function(ehrId1, ime1, priimek1) {
            console.log(ehrId1);
            $("#seznamBolnikov").append("<li><a href=\"#\" id=\"vrniPodatkePacienta1\">"+ime1+ " " + priimek1 + "</a></li>");
            $("#vrniPodatkePacienta1").click(function(event) {
               vrniPodatkePacienta(ehrId1); 
            });
            generirajPodatke(2,function(ehrId2, ime2, priimek2) {
                console.log(ehrId2);
                 $("#seznamBolnikov").append("<li><a href=\"#\" id=\"vrniPodatkePacienta2\">"+ime2+ " " + priimek2+"</a></li>");
                 $("#vrniPodatkePacienta2").click(function(event) {
                    vrniPodatkePacienta(ehrId2); 
                 });
                 generirajPodatke(3, function(ehrId3, ime3, priimek3) {
                    console.log(ehrId3);
                    $("#seznamBolnikov").append("<li><a href=\"#\" id=\"vrniPodatkePacienta3\">"+ime3+ " " + priimek3+"</a></li>");
                    $("#vrniPodatkePacienta3").click(function(event) {
                        vrniPodatkePacienta(ehrId3); 
                    }); 
                 });
            });
        });
    });
    
    zrisiGraf();
    
    initMap(center);
    
});

// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

var narediHitroDiagnozoZdravjaGeneriranih = function(callback) {
    
    document.getElementById("generiraniSporocilo").innerHTML = "";
    
    var sporocilo;
    var type;
    
    document.getElementById("rezultatHitreDiagnoze").innerHTML = "";
    
    var ehrId = $("#vrniEhrId").val();
    
    if(!ehrId || ehrId.trim().length == 0) {
        $("#generiraniSporocilo").html("Prosim vnesite podatke.");
    } else {
    
        $("#rezultatHitreDiagnoze").append("<table id=\"tabelaDiagnoz\" class=\"table table-striped\">"+
                                            "<tr><th>Tip diagnoze</th><th class=\"align-rght\">Rezultat</th></tr></table>");
        vrniVitalnePodatkeBolnika(ehrId, function(vitalniPodatki) {
            console.log(vitalniPodatki);
            diagnozaTelesneTemperature(vitalniPodatki.telesnaVrocina, function(error1) {
                diagnozaTelesneTeze(vitalniPodatki.telesnaTeza, vitalniPodatki.telesnaVisina, function(error2) {
                    diagnozaKrvnegaTlaka(vitalniPodatki.sistolicniKrvniTlak, vitalniPodatki.diastolicniKrvniTlak, function(error3) {
                        diagnozaNasicenostiKisika(vitalniPodatki.nasicenostKisika, function(error4) {
                            if(error1 == 2 || error4 == 2) {
                                sporocilo = "Obiščite zdravnika.";
                                type = "danger";
                            } else if (error1 == 1 || error4 == 1) {
                                sporocilo = "V primeru poslabšanja obiščite zdravnika";
                                type = "warning";
                            } else if (error2 || error3) {
                                sporocilo = "Vaše zdravje ni v neposredni nevarnosti. V primeru poslabšanja, obiščite zdravnika";
                                type = "info";
                            } else {
                                sporocilo = "Vaše zdravje je v mejah normale.";
                                type = "success";
                            }
                            $("#rezultatHitreDiagnoze").append("<div class=\"label label-"+type+" fade-in pull-right\">"+sporocilo+"</div>")
                        });
                    });
                });
            });
        });
    }
};

var diagnozaNasicenostiKisika = function(nasicenostKisika, callback) {
  var sporocilo;
  var error = 0;
  var type;
  
  if(nasicenostKisika > 95) {
      sporocilo = "Normalna zasičenost";
  } else {
      if(nasicenostKisika > 90) {
          sporocilo = "Zasičenost v zmernih mejah";
      } else {
          error = 1;
          if(nasicenostKisika > 80) {
              sporocilo = "Nizka zasičenost";
          } else {
              error = 2;
              sporocilo = "Kritično nizka zacičenost";
          }
      }
  }
  
  if(!error)
    type = "success";
  else if(error == 1)
    type = "warning";
  else
    type = "danger";
        
  $("#tabelaDiagnoz").append("<tr class=\""+type+"\"><td>Diagnoza telesne temperature</td>" +
                            "<td class=\"align-right\">"+sporocilo+"</td></tr>");
  callback(error);
};

var diagnozaKrvnegaTlaka = function(sistolicniKrvniTlak, diastolicniKrvniTlak, callback) {
    var sporocilo;
    var error = false;
    var type;
    
    if(sistolicniKrvniTlak < 140 && diastolicniKrvniTlak < 90) {
        sporocilo = "Visok normalen krvni tlak";
    } else {
        error = true;
        if(sistolicniKrvniTlak < 160 && diastolicniKrvniTlak < 100) {
            sporocilo = "Hipertenzija 1. stopnje";
        } else {
            if(sistolicniKrvniTlak < 180 && diastolicniKrvniTlak < 110) {
                sporocilo = "Hipertenzija 2. stopnje";
            } else {
                sporocilo = "Hipertenzija 3. stopnje";
            }
        }
    }
    
    if(!error)
        type = "success";
    else
        type = "warning";
    
    $("#tabelaDiagnoz").append("<tr class=\""+type+"\"><td>Diagnoza krvnega tlaka</td>" +
                                "<td class=\"align-right\">"+sporocilo+"</td></tr>");
    callback(error);
};

var diagnozaTelesneTeze = function(telesnaTeza, telesnaVisina, callback) {
    var BMI = telesnaTeza/Math.pow(telesnaVisina/100, 2);
    var sporocilo;
    var error = false;
    var type;
    
    if(BMI < 15.0) {
        sporocilo = "Kritično podhranjen";
        error = true;
    } else {
        if(BMI < 16) {
            sporocilo = "Precejšna podhranjenost";
        } else {
            if(BMI < 18.5) {
                sporocilo = "Podhranjen";
            } else {
                if(BMI < 25) {
                    sporocilo = "V mejah normale";
                } else {
                    if(BMI < 30) {
                        sporocilo = "Rahlo predebel";
                    } else {
                        if(BMI < 40) {
                            sporocilo = "Predebel";
                            error = true;
                        } else {
                            error = true;
                            sporocilo = "Kritično predebel";
                        }
                    }
                }
            }
        }
    }
    if(!error)
        type = "success";
    else
        type = "warning";
        
    $("#tabelaDiagnoz").append("<tr class=\""+type+"\"><td>Diagnoza ITM</td>" +
                                "<td class=\"align-right\">"+sporocilo+"</td></tr>");
    callback(error);
};

var diagnozaTelesneTemperature = function(telesnaTemperatura, callback) {
    
    var sporocilo;
    var error = 0;
    var type;

    console.log(telesnaTemperatura < 35.8);

    if(telesnaTemperatura < 35.8) {
        console.log(telesnaTemperatura);
        if(telesnaTemperatura < 35) {
            error = 2;
            sporocilo = "Kritična podhladitev";
        } else {
            error = 1;
            sporocilo = "Rahlo podhladitev";
        }
    } else {
        if(telesnaTemperatura > 37.2) {
            if(telesnaTemperatura > 39) {
                error = 2;
                sporocilo = "Kritično povišana";
            } else {
                error = 1;
                sporocilo = "Rahlo povišana";
            }
        } else {
            sporocilo = "V mejah normale";
        }
    }
    
    if(!error)
        type = "success";
    else if(error == 2)
        type = "danger";
    else
        type = "warning";
    
    $("#tabelaDiagnoz").append("<tr class=\""+type+"\"><td>Diagnoza telesne temperature</td>" +
                                "<td class=\"align-right\">"+sporocilo+"</td></tr>");
    callback(error);
};

var narediPoizvedboPoEhrId = function(callback) {
    
    document.getElementById("poizvedbaSporocilo").innerHTML = "";
    
    var ehrId = $("#vnesiEhrId").val();
    var sessionId = getSessionId();
    
    if(!ehrId || ehrId.trim().length == 0) {
      $("#poizvedbaSporocilo").html("Prosim vnesite podatke.");
    } else {
        $.ajax({
            url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
            type: 'GET',
            headers: {"EHR-Session": sessionId},
            success: function(data) {
                vrniVitalnePodatkeBolnika(ehrId, function(vitalniPodatki) {
                    var party = data.party;
                    $("#vnesiIme").val(party.firstNames);
                    $("#vnesiPriimek").val(party.lastNames);
                    $("#vnesiDatum").val(party.dateOfBirth);
                    $("#vnesiTelesnoVisino").val(vitalniPodatki.telesnaVisina);
                    $("#vnesiTelesnoTeza").val(vitalniPodatki.telesnaTeza);
                    $("#vnesiTelesnoTemperaturo").val(vitalniPodatki.telesnaVrocina);
                    $("#vnesiSistolicni").val(vitalniPodatki.sistolicniKrvniTlak);
                    $("#vnesiDiastolicni").val(vitalniPodatki.diastolicniKrvniTlak);
                    $("#vnesiNasicenostKisika").val(vitalniPodatki.nasicenostKisika);
                });
            }
        });
    }
};

var narediHitroDiagnozoZdravjaVneseni = function(callback) {
    
    document.getElementById("vnosPodtakovSporocilo").innerHTML = "";
    
    var sporocilo;
    var type;
    
    document.getElementById("rezultatHitreDiagnoze").innerHTML = "";
    
    var vitalniPodatki = {
        "sistolicniKrvniTlak": $("#vnesiSistolicni").val(),
        "diastolicniKrvniTlak": $("#vnesiDiastolicni").val(),
        "telesnaVrocina": $("#vnesiTelesnoTemperaturo").val(),
        "nasicenostKisika": $("#vnesiNasicenostKisika").val(),
        "telesnaVisina": $("#vnesiTelesnoVisino").val(),
        "telesnaTeza": $("#vnesiTelesnoTeza").val()
    };
    
    if(!vitalniPodatki.sistolicniKrvniTlak || vitalniPodatki.sistolicniKrvniTlak.trim().length == 0) {
        $("#vnosPodtakovSporocilo").append("Obvezno polje: Sistolicni krvni tlak");
    } else if (!vitalniPodatki.diastolicniKrvniTlak || vitalniPodatki.diastolicniKrvniTlak.trim().length == 0) {
        $("#vnosPodtakovSporocilo").append("Obvezno polje: Diastolicni krvni tlak");
    } else if (!vitalniPodatki.telesnaVrocina || vitalniPodatki.telesnaVrocina.trim().length == 0) {
        $("#vnosPodtakovSporocilo").append("Obvezno polje: Telesna temperatura");
    } else if (!vitalniPodatki.nasicenostKisika || vitalniPodatki.nasicenostKisika.trim().length == 0) {
        $("#vnosPodtakovSporocilo").append("Obvezno polje: Nasicenost kisika");
    } else if (!vitalniPodatki.telesnaTeza || !vitalniPodatki.telesnaVisina || vitalniPodatki.telesnaTeza.trim().length == 0 || vitalniPodatki.telesnaVisina.trim().length == 0) {
        $("#vnosPodtakovSporocilo").append("Obvezno polje: telesna visina in telesna teza");
    } else {
        $("#rezultatHitreDiagnoze").append("<table id=\"tabelaDiagnoz\" class=\"table table-striped\">"+
                                            "<tr><th>Tip diagnoze</th><th class=\"align-rght\">Rezultat</th></tr></table>");
        
        diagnozaTelesneTemperature(vitalniPodatki.telesnaVrocina, function(error1) {
            diagnozaTelesneTeze(vitalniPodatki.telesnaTeza, vitalniPodatki.telesnaVisina, function(error2) {
                diagnozaKrvnegaTlaka(vitalniPodatki.sistolicniKrvniTlak, vitalniPodatki.diastolicniKrvniTlak, function(error3) {
                    diagnozaNasicenostiKisika(vitalniPodatki.nasicenostKisika, function(error4) {
                        if(error1 == 2 || error4 == 2) {
                            sporocilo = "Obiščite zdravnika.";
                            type = "danger";
                        } else if (error1 == 1 || error4 == 1) {
                            sporocilo = "V primeru poslabšanja obiščite zdravnika";
                            type = "warning";
                        } else if (error2 || error3) {
                            sporocilo = "Vaše zdravje ni v neposredni nevarnosti. V primeru poslabšanja, obiščite zdravnika";
                            type = "info";
                        } else {
                            sporocilo = "Vaše zdravje je v mejah normale.";
                            type = "success";
                        }
                        $("#rezultatHitreDiagnoze").append("<div class=\"label label-"+type+" fade-in pull-right\">"+sporocilo+"</div>")
                    });
                });
            });
        });
    }
};

var vrniVitalnePodatkeBolnika = function(ehrId, callback) {
    var sessionId = getSessionId();
    var podatkiOKrvnemTlaku;
    
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/blood_pressure",
        type: 'GET',
        headers: {"EHR-Session": sessionId},
        success: function(data1) {
            $.ajax({
               url: baseUrl + "/view/" + ehrId + "/body_temperature",
               type: 'GET',
               headers: {"EHR-Session": sessionId}, 
               success: function(data2) {
                   $.ajax({
                       url: baseUrl + "/view/" + ehrId + "/spO2",
                       type: 'GET',
                       headers: {"EHR-Session": sessionId},
                       success: function(data3) {
                           $.ajax({
                               url: baseUrl + "/view/" + ehrId + "/height",
                               type: 'GET',
                               headers: {"EHR-Session": sessionId},
                               success: function(data4) {
                                   $.ajax({
                                       url: baseUrl + "/view/" + ehrId + "/weight",
                                       type: 'GET',
                                       headers: {"EHR-Session": sessionId},
                                       success: function(data5) {
                                           podatkiOKrvnemTlaku = {
                                               "sistolicniKrvniTlak": data1[0].systolic,
                                               "diastolicniKrvniTlak": data1[0].diastolic,
                                               "telesnaVrocina": data2[0].temperature,
                                               "merskaEnotaToplote": data2[0].unit,
                                               "nasicenostKisika": data3[0].spO2,
                                               "telesnaVisina": data4[0].height,
                                               "merskaEnotaVisine": data4[0].unit,
                                               "telesnaTeza": data5[0].weight,
                                               "merskaEnotaTeze": data5[0].unit
                                           };
                                           callback(podatkiOKrvnemTlaku);
                                       }
                                   });
                               }
                           });
                       }
                   });
               }
            });
        }
    });
};

function zrisiGraf() {
    var visina = [100,110,120,130,140,150,160,170,180,190,200,210,220];
    var teza15 = [10 ,20 ,30 ,40 ,50 ,60 ,50 ,40 ,30 ,20 ,10 ,20 ,30 ];
    for(var i=0; i<visina.length; i++) {
        teza15[i] = Math.pow(visina[i]/100,2)*15;
    }
    new Morris.Area({
      // ID of the element in which to draw the chart.
        element: 'myfirstchart',
        data: data(),
        // The name of the data record attribute that contains x-values.
        xkey: 'x',
        xLabels: 'teza',
        parseTime: false,
        hoverCallback: function(index, options, content, row) {
            return "Visina: "+ row.x + " cm<br>BMI40: " + (row.y+row.z+row.y1+row.y2+row.y3) +" kg<br>BMI30: " + (row.z+row.y+row.y1+row.y2) +
                            " kg<br>BMI25: "+ (row.z+row.y+row.y1) +" kg<br>BMI18: "+(row.y+row.z)+" kg<br>BMI15: "+row.y + " kg";
        },
        hideHover: true,
        // A list of names of data record attributes that contain y-values.
        ykeys: ['y','z', 'y1','y2','y3'],
        // Labels for the ykeys -- will be displayed when you hover over the
        // chart.
        lineColors: ['#003366','#00cc99','#66ff33','#ff6600','#ff0000'],
        labels: ['BMI15', 'BMI18'],
        smooth: false
    });
}

function data() {
  var ret = [];
  for (var x = 110; x <= 220; x += 10) {
    ret.push({
      x: x,
      y: Math.floor(Math.pow(x/100,2)*15),
      z: Math.floor(Math.pow(x/100,2)*18-Math.pow(x/100,2)*15),
      y1: Math.floor(Math.pow(x/100,2)*25-Math.pow(x/100,2)*18),
      y2: Math.floor(Math.pow(x/100,2)*30-Math.pow(x/100,2)*25),
      y3: Math.floor(Math.pow(x/100,2)*40-Math.pow(x/100,2)*30)
    });
  }
  return ret;
}

function lokacija() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getPosition);
    } else { 
        console.log("Geolocation is not supported by this browser.");
    }
}

function getPosition(position) {
    console.log(position.coords.latitude + ", " + position.coords.longitude);
    center = {lat: position.coords.latitude, lng: position.coords.longitude};
    initMap(center);
}


//GoogleMapAPI

var map;
var infowindow;
var center = {lat: 46.0548979, lng: 14.5219206};

function initMap(center) {

  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: 11
  });
  
  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: center,
    radius: 10000,
    types: ['hospital','doctor'],
  }, sment);
  
  var marker = new google.maps.Marker({
      map: map,
      position: center
  });
  
  google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent("Trenutno se nahajate tu.");
      infowindow.open(map, this);
  });
  
}

function sment(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: placeLoc
    });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}
