import { Button, KIND } from "baseui/button";
import { Search, Show } from "baseui/icon";
import { Modal } from "baseui/modal";
import { Select } from "baseui/select";
import { parse } from "date-fns";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { HeaderMain, CalendarContainer, CalendarSectionContainer, MonthContainer, ModalGrid, VaccineCentre} from './VaxComponents'
import "./App.css";
import { DateLocationsPairsContext } from "./contexts";
import { getMyCalendar } from "./getData";
import { DateLocationsPair, LocationSlotsPair } from "./types";
import { getDistanceKm } from "./distanceUtils";

function sum(array: number[]) {
  return array.reduce((a, b) => a + b, 0);
}

function App() {
  const [isOpen, setIsOpen] = React.useState<DateLocationsPair | null>(null);
  function close() {
    setIsOpen(null);
  }
  const [radiusKm, setRadiusKm] = useState(30);
  const [lat, setLat] = useState(-36.853610199274385);
  const [lng, setLng] = useState(174.76054541484535);
  const { dateLocationsPairs, setDateLocationsPairs } = useContext(
    DateLocationsPairsContext
  );
  const loadCalendar = useCallback(async () => {
    const data = await getMyCalendar(lat, lng, radiusKm);
    setDateLocationsPairs(data);
  }, [lat, lng, radiusKm, setDateLocationsPairs]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
    } else {
      navigator.geolocation.getCurrentPosition((position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      });
    }
  };

  return (
    <>
      <div className="App">
          <Modal
            onClose={close}
            isOpen={!!isOpen}
            overrides={{
              Root: { style: { zIndex: 1500 } },
              Dialog: {
                style: {
                  width: "80vw",
                  height: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  padding: "1.5rem",
                },
              },
            }}
          >
            <ModalGrid>
              <div style={{ position: "sticky", top: "0", display: "block" }}>
                <h1>Available slots <br/> for {isOpen?.dateStr}</h1>
               
                <p>Data from bookmyvaccine.nz</p>
                <Button
                  onClick={() => setIsOpen(null)}
                  overrides={{
                    Root: { style: { width: "100%", margin: "2rem 0" } },
                  }}
                  kind={KIND.secondary}
                >
                  Back to calendar
                </Button>
              
              </div>

              <div style={{ overflow: "scroll" }}>
                {sortByDistance(isOpen?.locationSlotsPairs, lat, lng)
                  .filter(
                    (locationSlotsPair) => locationSlotsPair.slots?.length
                  )
                  .map((locationSlotsPair) => (
                    <VaccineCentre>
                      <h3>{locationSlotsPair.location.name}</h3>
                      <p>{locationSlotsPair.location.displayAddress} ({Math.floor(getDistanceKm(lat, lng, locationSlotsPair.location.location.lat, locationSlotsPair.location.location.lng))}km away)</p>
                      <a href="https://bookmyvaccine.nz" target="_blank">
                        <div className='ButtonConstraint'>
                        <Button
                              
                    overrides={{
                      Root: { style: { width: "100%", margin: "1rem 0" } },
                      
                    }}
                  >
                    Make a Booking
                          </Button>
                          </div>
                </a>
                      <p style={{ margin: "0.25rem 0 0.5rem 0" }}>
                        Available slots:
                      </p>
                      <section>
                        {/* <p>1am</p> */}
                        {locationSlotsPair.slots?.map((slot) => (
                          <p>
                            {parse(
                              slot.localStartTime,
                              "HH:mm:ss",
                              new Date()
                            ).toLocaleTimeString("en-NZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        ))}
                      </section>
                    </VaccineCentre>
                  ))}
              </div>
            </ModalGrid>
          </Modal>
        {/* <pre>{JSON.stringify({ dateLocationsPairs }, null, 2)}</pre> */}

        <section className="App-header">
          <h1>Vaccine Calendar</h1>
          <p>
            Check vaccine booking availability for all sites before making a booking. This
            is an unofficial website and pulls data from bookmyvaccine.nz{" "}
          </p>
        </section>

        <HeaderMain>
        
          <h1>Available Vaccine Slots</h1>
          <div >
        

            <Select
              options={[
                { label: "Whthin 30km", id: "#F0F8FF" },
                { label: "Within 60km", id: "#FAEBD7" },
                { label: "Within 90km", id: "#00FFFF" },
              ]}
              placeholder={`Within ${radiusKm}km`}
              disabled={true} // TODO: implement
            />
            
            <Button
              startEnhancer={() => <Search size={24} />}
              kind={KIND.secondary}
              onClick={getLocation}
            >
              Edit your Location
            </Button>
                <a href="https://github.com/CovidEngine/vaxxnz" target="_blank">
              <Button 
              startEnhancer={() => <Show size={24} />} kind={KIND.secondary}>View Source Code</Button>
            </a>
          </div>
        </HeaderMain>
        <CalendarContainer>
          <CalendarSectionContainer>
            <h2>September 2021</h2>
            <MonthContainer>
              {dateLocationsPairs.map((dateLocationsPair) => (
                <button onClick={() => setIsOpen(dateLocationsPair)}>
                  <div>
                  <h3>
                    {parse(
                      dateLocationsPair.dateStr,
                      "yyyy-MM-dd",
                      new Date()
                    ).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <p>
                    {sum(
                      dateLocationsPair.locationSlotsPairs.map(
                        (locationSlotsPair) =>
                          (locationSlotsPair.slots || []).length
                      )
                    )}{" "}
                    available
                    </p>
                    </div>
                  <img src='./arrow.svg' aria-hidden='true' alt='' />
                </button>
              ))}
            </MonthContainer>
          </CalendarSectionContainer>
        </CalendarContainer>
      </div>
    </>
  );
}

export default App;



export function sortBy<T = unknown>(
  notes: T[],
  comparator: (note: T) => string | number,
) {
  return [...notes].sort((a: T, b: T) => {
    if (comparator(a) < comparator(b)) {
      return -1;
    }
    if (comparator(a) > comparator(b)) {
      return 1;
    }
    return 0;
  });
}

function sortByDistance(locationSlotsPairs: LocationSlotsPair[] | undefined, lat: number, lng: number): LocationSlotsPair[] {
  return sortBy(locationSlotsPairs ?? [], locationSlotsPair => {
    const distanceKm = getDistanceKm(lat, lng, locationSlotsPair.location.location.lat, locationSlotsPair.location.location.lng)
    return distanceKm
  });
}

