import React, { createContext, useState, useContext } from 'react';

export const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
    const [patientInfo, setPatientInfo] = useState(null);

    const updatePatientInfo = (info) => {
        setPatientInfo(info);
    };

    return (
        <PatientContext.Provider value={{ patientInfo, updatePatientInfo }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatient = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatient must be used within a PatientProvider');
    }
    return context;
}; 