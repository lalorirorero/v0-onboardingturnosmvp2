"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Info, Plus, X, Play, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import * as XLSX from "xlsx"

export default function OnboardingTurnos() {
  const [step, setStep] = useState(0)

  // Estado para Empresa
  const [empresa, setEmpresa] = useState({
    razonSocial: "",
    rut: "",
    direccion: "",
    sistema: [], // Array para múltiples sistemas
    grupos: [],
  })

  // Estado para Administradores (ahora múltiples)
  const [administradores, setAdministradores] = useState([
    {
      nombre: "",
      rut: "",
      telefono: "",
      email: "",
    },
  ])

  // Estado para Trabajadores
  const [trabajadores, setTrabajadores] = useState([])
  const [bulkData, setBulkData] = useState("")

  // Estado para Turnos
  const [turnos, setTurnos] = useState([
    {
      id: Date.now(),
      nombre: "",
      horaInicio: "",
      horaFin: "",
      colacion: "",
    },
  ])

  // Estado para Planificaciones
  const [planificaciones, setPlanificaciones] = useState([
    {
      id: Date.now(),
      nombre: "",
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: "",
      sabado: "",
      domingo: "",
    },
  ])

  // Estado para Asignaciones
  const [asignaciones, setAsignaciones] = useState([])

  const steps = [
    { title: "Empresa y grupos", description: "Datos base de la empresa" },
    { title: "Admin", description: "Responsable de la cuenta" },
    { title: "Trabajadores", description: "Listado inicial" },
    { title: "Turnos", description: "Definición de turnos" },
    { title: "Planificaciones", description: "Tipos de planificación semanal" },
    { title: "Asignación", description: "Quién trabaja qué planificación" },
    { title: "Resumen", description: "Revisión final" },
  ]

  // Funciones para manejar cambios en Empresa
  const handleEmpresaChange = (field, value) => {
    setEmpresa((prev) => ({ ...prev, [field]: value }))
  }

  const handleSistemaChange = (sistema) => {
    setEmpresa((prev) => {
      const sistemas = prev.sistema || []
      if (sistemas.includes(sistema)) {
        return { ...prev, sistema: sistemas.filter((s) => s !== sistema) }
      } else {
        return { ...prev, sistema: [...sistemas, sistema] }
      }
    })
  }

  // Funciones para Administradores
  const handleAdminChange = (index, field, value) => {
    const newAdmins = [...administradores]
    newAdmins[index][field] = value
    setAdministradores(newAdmins)

    // Sincronizar con trabajadores
    syncAdminsToTrabajadores(newAdmins)
  }

  const addAdmin = () => {
    const newAdmin = {
      nombre: "",
      rut: "",
      telefono: "",
      email: "",
    }
    setAdministradores([...administradores, newAdmin])
  }

  const removeAdmin = (index) => {
    if (administradores.length > 1) {
      const newAdmins = administradores.filter((_, i) => i !== index)
      setAdministradores(newAdmins)
      syncAdminsToTrabajadores(newAdmins)
    }
  }

  const syncAdminsToTrabajadores = (admins) => {
    setTrabajadores((prev) => {
      // Remover todos los admins anteriores
      const nonAdmins = prev.filter((t) => t.tipo !== "admin")

      // Agregar los admins actualizados
      const adminsTrabajadores = admins
        .filter((admin) => admin.nombre && admin.rut)
        .map((admin) => {
          const [nombres = "", apellidos = ""] = admin.nombre.split(" ", 2)
          return {
            rut: admin.rut,
            email: admin.email || "",
            nombres: nombres,
            apellidos: apellidos,
            grupo: "Admin",
            telefono1: admin.telefono || "",
            telefono2: "",
            telefono3: "",
            tipo: "admin",
          }
        })

      return [...adminsTrabajadores, ...nonAdmins]
    })
  }

  // Función para asegurar que un grupo existe
  const ensureGrupoByName = (grupoNombre) => {
    if (!grupoNombre || grupoNombre.trim() === "") return null

    const grupoExistente = empresa.grupos.find((g) => g.nombre.toLowerCase() === grupoNombre.toLowerCase())

    if (grupoExistente) {
      return grupoExistente.id
    }

    const nuevoGrupo = {
      id: Date.now() + Math.random(),
      nombre: grupoNombre.trim(),
    }

    setEmpresa((prev) => ({
      ...prev,
      grupos: [...prev.grupos, nuevoGrupo],
    }))

    return nuevoGrupo.id
  }

  // Funciones para Trabajadores
  const handleBulkImport = () => {
    const lines = bulkData.trim().split("\n")
    const newTrabajadores = []

    lines.forEach((line) => {
      const cols = line.split("\t")
      if (cols.length >= 4) {
        const grupoNombre = cols[4] ? cols[4].trim() : ""
        const grupoId = grupoNombre ? ensureGrupoByName(grupoNombre) : null

        newTrabajadores.push({
          rut: cols[0] || "",
          email: cols[1] || "",
          nombres: cols[2] || "",
          apellidos: cols[3] || "",
          grupo: grupoNombre,
          grupoId: grupoId,
          telefono1: cols[5] || "",
          telefono2: cols[6] || "",
          telefono3: cols[7] || "",
          tipo: "usuario",
        })
      }
    })

    // Mantener los admins y agregar los nuevos usuarios
    setTrabajadores((prev) => {
      const admins = prev.filter((t) => t.tipo === "admin")
      return [...admins, ...newTrabajadores]
    })
    setBulkData("")
  }

  const handleTrabajadorChange = (index, field, value) => {
    const newTrabajadores = [...trabajadores]
    newTrabajadores[index][field] = value
    setTrabajadores(newTrabajadores)
  }

  const addTrabajador = () => {
    setTrabajadores([
      ...trabajadores,
      {
        rut: "",
        email: "",
        nombres: "",
        apellidos: "",
        grupo: "",
        telefono1: "",
        telefono2: "",
        telefono3: "",
        tipo: "usuario",
      },
    ])
  }

  const removeTrabajador = (index) => {
    // No permitir eliminar admins
    if (trabajadores[index].tipo === "admin") {
      alert("No se pueden eliminar administradores desde esta sección")
      return
    }
    setTrabajadores(trabajadores.filter((_, i) => i !== index))
  }

  // Funciones para Turnos
  const handleTurnoChange = (index, field, value) => {
    const newTurnos = [...turnos]
    newTurnos[index][field] = value
    setTurnos(newTurnos)
  }

  const addTurno = () => {
    setTurnos([
      ...turnos,
      {
        id: Date.now(),
        nombre: "",
        horaInicio: "",
        horaFin: "",
        colacion: "",
      },
    ])
  }

  const removeTurno = (index) => {
    if (turnos.length > 1) {
      setTurnos(turnos.filter((_, i) => i !== index))
    }
  }

  // Funciones para Planificaciones
  const handlePlanificacionChange = (index, field, value) => {
    const newPlanificaciones = [...planificaciones]
    newPlanificaciones[index][field] = value
    setPlanificaciones(newPlanificaciones)
  }

  const addPlanificacion = () => {
    setPlanificaciones([
      ...planificaciones,
      {
        id: Date.now(),
        nombre: "",
        lunes: "",
        martes: "",
        miercoles: "",
        jueves: "",
        viernes: "",
        sabado: "",
        domingo: "",
      },
    ])
  }

  const removePlanificacion = (index) => {
    if (planificaciones.length > 1) {
      setPlanificaciones(planificaciones.filter((_, i) => i !== index))
    }
  }

  // Funciones para Asignaciones
  const handleAsignacionChange = (index, field, value) => {
    const newAsignaciones = [...asignaciones]
    newAsignaciones[index][field] = value
    setAsignaciones(newAsignaciones)
  }

  const addAsignacion = () => {
    setAsignaciones([
      ...asignaciones,
      {
        trabajadorRut: "",
        planificacionId: "",
        fechaInicio: "",
        fechaFin: "",
      },
    ])
  }

  const removeAsignacion = (index) => {
    setAsignaciones(asignaciones.filter((_, i) => i !== index))
  }

  // Funciones de navegación
  const handleNext = () => {
    // Validaciones
    if (step === 0) {
      if (!empresa.razonSocial || !empresa.rut) {
        alert("Por favor complete los campos obligatorios de la empresa")
        return
      }
    }
    if (step === 1) {
      const invalidAdmin = administradores.some((admin) => !admin.nombre || !admin.rut || !admin.email)
      if (invalidAdmin) {
        alert("Por favor complete todos los campos de los administradores")
        return
      }
    }
    if (step === 3) {
      const turnoSinNombre = turnos.some((turno) => !turno.nombre || turno.nombre.trim() === "")
      if (turnoSinNombre) {
        alert("Todos los turnos deben tener un nombre")
        return
      }
    }
    if (step === 4) {
      const planificacionSinNombre = planificaciones.some((plan) => !plan.nombre || plan.nombre.trim() === "")
      if (planificacionSinNombre) {
        alert("Todas las planificaciones deben tener un nombre")
        return
      }
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  // Función para exportar a Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Hoja 1: Datos de la empresa y admin
    const datosEmpresa = [
      ["DATOS DE LA EMPRESA"],
      ["Razón Social", empresa.razonSocial],
      ["Nombre de fantasía", empresa.razonSocial],
      ["RUT", empresa.rut],
      ["Giro", empresa.direccion],
      ["Dirección", empresa.direccion],
      ["Comuna", ""],
      ["Email de facturación", administradores[0]?.email || ""],
      ["Teléfono de contacto", administradores[0]?.telefono || ""],
      ["Sistema", (empresa.sistema || []).join(", ")],
      ["Rubio", ""],
      [],
      ["Datos Administrador del Sistema"],
      ["Nombre", administradores[0]?.nombre || ""],
      ["RUT", administradores[0]?.rut || ""],
      ["Teléfono Contacto", administradores[0]?.telefono || ""],
      ["Correo", administradores[0]?.email || ""],
    ]

    const ws1 = XLSX.utils.aoa_to_sheet(datosEmpresa)
    XLSX.utils.book_append_sheet(wb, ws1, "Datos Empresa")

    // Hoja 2: Trabajadores y Planificaciones
    const headers = [
      "Rut Completo",
      "Correo Personal",
      "Nombres",
      "Apellidos",
      "Grupo",
      "Fecha Inicio Planificación",
      "Fecha Fin Planificación",
      "Entrada",
      "Col (minutos)",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "Entrada",
      "Col",
      "Salida",
      "TELÉFONOS MARCAJE POR VICTORIA CALL",
    ]

    const subHeaders = ["", "", "", "", "", "", "", ...Array(7).fill(["", "", ""]).flat(), ""]

    const daysRow = [
      "",
      "",
      "",
      "",
      "",
      "",
      "Lunes",
      "",
      "",
      "Martes",
      "",
      "",
      "Miércoles",
      "",
      "",
      "Jueves",
      "",
      "",
      "Viernes",
      "",
      "",
      "Sábado",
      "",
      "",
      "Domingo",
      "",
      "",
      "",
    ]

    const data = trabajadores.map((t) => {
      const asignacion = asignaciones.find((a) => a.trabajadorRut === t.rut)
      const planificacion = asignacion
        ? planificaciones.find((p) => p.id === Number.parseInt(asignacion.planificacionId))
        : null

      const getTurnoData = (diaKey) => {
        if (!planificacion) return ["", "", ""]
        const turnoNombre = planificacion[diaKey]
        const turno = turnos.find((tur) => tur.nombre === turnoNombre)
        if (!turno) return ["", "", ""]
        return [turno.horaInicio || "", turno.colacion || "", turno.horaFin || ""]
      }

      return [
        t.rut,
        t.email,
        t.nombres,
        t.apellidos,
        t.grupo,
        asignacion?.fechaInicio || "PERMANENTE",
        asignacion?.fechaFin || "",
        ...getTurnoData("lunes"),
        ...getTurnoData("martes"),
        ...getTurnoData("miercoles"),
        ...getTurnoData("jueves"),
        ...getTurnoData("viernes"),
        ...getTurnoData("sabado"),
        ...getTurnoData("domingo"),
        [t.telefono1, t.telefono2, t.telefono3].filter(Boolean).join(" "),
      ]
    })

    const ws2Data = [daysRow, headers, ...data]
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)
    XLSX.utils.book_append_sheet(wb, ws2, "Planificación")

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `onboarding_${empresa.razonSocial || "empresa"}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Onboarding Turnos</h1>

      {/* Stepper compacto */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`
              p-2 rounded-lg border-2 transition-all text-center min-w-0
              ${
                i < step
                  ? "bg-green-50 border-green-500"
                  : i === step
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 border-gray-300"
              }
            `}
          >
            <div className="flex items-center justify-center mb-1">
              {i < step ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span
                  className={`
                  h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold
                  ${i === step ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"}
                `}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <h3 className="text-xs font-semibold truncate">{s.title}</h3>
            <p className="text-[10px] text-gray-600 truncate">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Paso 0: Empresa */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Empresa</CardTitle>
            <CardDescription>Información básica de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="razonSocial">Razón Social *</Label>
              <Input
                id="razonSocial"
                value={empresa.razonSocial}
                onChange={(e) => handleEmpresaChange("razonSocial", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rut">RUT *</Label>
              <Input id="rut" value={empresa.rut} onChange={(e) => handleEmpresaChange("rut", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={empresa.direccion}
                onChange={(e) => handleEmpresaChange("direccion", e.target.value)}
              />
            </div>
            <div>
              <Label>Sistema (puede seleccionar varios)</Label>
              <div className="space-y-2 mt-2">
                {[
                  "1.- Geovictoria BOX",
                  "2.- Geovictoria APP",
                  "3.- Geovictoria CALL",
                  "4.- SOLO MARCAJE",
                  "5.- DISTRIBUCIÓN",
                ].map((sistema) => (
                  <label key={sistema} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(empresa.sistema || []).includes(sistema)}
                      onChange={() => handleSistemaChange(sistema)}
                      className="rounded"
                    />
                    <span className="text-sm">{sistema}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 1: Administradores */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Administradores</CardTitle>
            <CardDescription>Responsables de la cuenta (puede agregar varios)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {administradores.map((admin, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                {administradores.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeAdmin(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <h4 className="font-semibold">Administrador {index + 1}</h4>
                <div>
                  <Label>Nombre Completo *</Label>
                  <Input value={admin.nombre} onChange={(e) => handleAdminChange(index, "nombre", e.target.value)} />
                </div>
                <div>
                  <Label>RUT *</Label>
                  <Input value={admin.rut} onChange={(e) => handleAdminChange(index, "rut", e.target.value)} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={admin.telefono}
                    onChange={(e) => handleAdminChange(index, "telefono", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={admin.email}
                    onChange={(e) => handleAdminChange(index, "email", e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button onClick={addAdmin} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar otro administrador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Trabajadores */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Trabajadores</CardTitle>
            <CardDescription>Carga inicial de trabajadores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pegado masivo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pegado masivo desde Excel</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Ver tutorial
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Cómo pegar trabajadores desde Excel</DialogTitle>
                      <DialogDescription>Sigue estos pasos para importar trabajadores correctamente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <video controls className="w-full rounded-lg">
                        <source src="/images/screen-capture-20-2845-29-20-28online-video-cutter.mp4" type="video/mp4" />
                      </video>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">Instrucciones:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Selecciona las columnas en Excel en este orden: RUT, Email, Nombres, Apellidos, Grupo</li>
                          <li>Opcionalmente puedes agregar hasta 3 teléfonos para Victoria Call (columnas 6, 7 y 8)</li>
                          <li>Copia las celdas (Ctrl+C o Cmd+C)</li>
                          <li>Pega en el campo de texto de abajo (Ctrl+V o Cmd+V)</li>
                          <li>Haz clic en "Importar trabajadores"</li>
                        </ol>
                        <p className="text-muted-foreground mt-2">
                          <strong>Nota:</strong> Los teléfonos son opcionales. Si no los necesitas, simplemente no
                          pegues esas columnas.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                placeholder="Pega aquí los datos desde Excel (RUT, Email, Nombres, Apellidos, Grupo, Tel1, Tel2, Tel3)..."
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                rows={6}
              />
              <Button onClick={handleBulkImport} disabled={!bulkData.trim()}>
                Importar trabajadores
              </Button>
            </div>

            {/* Lista de trabajadores */}
            {trabajadores.length > 0 && (
              <div className="space-y-2">
                <Label>Trabajadores cargados ({trabajadores.length})</Label>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">RUT</th>
                        <th className="p-2 text-left">Nombres</th>
                        <th className="p-2 text-left">Apellidos</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Grupo</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Tel 1</th>
                        <th className="p-2 text-left">Tel 2</th>
                        <th className="p-2 text-left">Tel 3</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trabajadores.map((t, i) => (
                        <tr key={i} className={t.tipo === "admin" ? "bg-blue-50" : ""}>
                          <td className="p-2">
                            <Input
                              value={t.rut}
                              onChange={(e) => handleTrabajadorChange(i, "rut", e.target.value)}
                              disabled={t.tipo === "admin"}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.nombres}
                              onChange={(e) => handleTrabajadorChange(i, "nombres", e.target.value)}
                              disabled={t.tipo === "admin"}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.apellidos}
                              onChange={(e) => handleTrabajadorChange(i, "apellidos", e.target.value)}
                              disabled={t.tipo === "admin"}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.email}
                              onChange={(e) => handleTrabajadorChange(i, "email", e.target.value)}
                              disabled={t.tipo === "admin"}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.grupo}
                              onChange={(e) => handleTrabajadorChange(i, "grupo", e.target.value)}
                              disabled={t.tipo === "admin"}
                            />
                          </td>
                          <td className="p-2">
                            <Badge variant={t.tipo === "admin" ? "default" : "secondary"}>
                              {t.tipo === "admin" ? "Admin" : "Usuario"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.telefono1 || ""}
                              onChange={(e) => handleTrabajadorChange(i, "telefono1", e.target.value)}
                              placeholder="+56912345678"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.telefono2 || ""}
                              onChange={(e) => handleTrabajadorChange(i, "telefono2", e.target.value)}
                              placeholder="+56912345678"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={t.telefono3 || ""}
                              onChange={(e) => handleTrabajadorChange(i, "telefono3", e.target.value)}
                              placeholder="+56912345678"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTrabajador(i)}
                              disabled={t.tipo === "admin"}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button onClick={addTrabajador} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar trabajador manualmente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Turnos */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Turnos</CardTitle>
            <CardDescription>Define los bloques de horario de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>¿Qué son los Turnos?</strong>
                <br />
                Los turnos son bloques básicos de horario que definen hora de entrada, salida y colación. Estos turnos
                se usarán luego para construir planificaciones semanales completas.
                <br />
                <br />
                <strong>Ejemplo:</strong> "Turno Mañana" (8:30-17:30, 60min colación)
              </AlertDescription>
            </Alert>

            {turnos.map((turno, index) => (
              <div key={turno.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Turno {index + 1}</h4>
                  {turnos.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeTurno(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del turno *</Label>
                    <Input
                      value={turno.nombre}
                      onChange={(e) => handleTurnoChange(index, "nombre", e.target.value)}
                      placeholder="Ej: Turno Mañana"
                    />
                  </div>
                  <div>
                    <Label>Colación (minutos)</Label>
                    <Input
                      type="number"
                      value={turno.colacion}
                      onChange={(e) => handleTurnoChange(index, "colacion", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hora inicio</Label>
                    <Input
                      type="time"
                      value={turno.horaInicio}
                      onChange={(e) => handleTurnoChange(index, "horaInicio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hora fin</Label>
                    <Input
                      type="time"
                      value={turno.horaFin}
                      onChange={(e) => handleTurnoChange(index, "horaFin", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={addTurno} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar turno
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Planificaciones */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Planificaciones</CardTitle>
            <CardDescription>Define patrones semanales de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>¿Qué son las Planificaciones?</strong>
                <br />
                Las planificaciones son patrones semanales que combinan los turnos que creaste anteriormente. Cada día
                de la semana puede tener un turno diferente o estar libre.
                <br />
                <br />
                <strong>Relación:</strong> Planificaciones → están formadas por → Turnos
              </AlertDescription>
            </Alert>

            {planificaciones.map((plan, index) => (
              <div key={plan.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Planificación {index + 1}</h4>
                  {planificaciones.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removePlanificacion(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Nombre de la planificación *</Label>
                  <Input
                    value={plan.nombre}
                    onChange={(e) => handlePlanificacionChange(index, "nombre", e.target.value)}
                    placeholder="Ej: Semana Normal"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map((dia) => (
                    <div key={dia}>
                      <Label className="capitalize">{dia}</Label>
                      <select
                        className="w-full border rounded p-2"
                        value={plan[dia]}
                        onChange={(e) => handlePlanificacionChange(index, dia, e.target.value)}
                      >
                        <option value="">Libre</option>
                        {turnos.map((t) => (
                          <option key={t.id} value={t.nombre}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button onClick={addPlanificacion} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar planificación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 5: Asignaciones */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones</CardTitle>
            <CardDescription>Asigna trabajadores a planificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>¿Qué son las Asignaciones?</strong>
                <br />
                Las asignaciones vinculan trabajadores específicos con planificaciones durante un período de tiempo.
                Aquí defines quién trabaja qué patrón semanal y desde cuándo.
                <br />
                <br />
                <strong>Relación completa:</strong> Asignaciones → usan → Planificaciones → formadas por → Turnos
              </AlertDescription>
            </Alert>

            {asignaciones.map((asig, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Asignación {index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeAsignacion(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trabajador</Label>
                    <select
                      className="w-full border rounded p-2"
                      value={asig.trabajadorRut}
                      onChange={(e) => handleAsignacionChange(index, "trabajadorRut", e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {trabajadores.map((t, i) => (
                        <option key={i} value={t.rut}>
                          {t.nombres} {t.apellidos} ({t.rut})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Planificación</Label>
                    <select
                      className="w-full border rounded p-2"
                      value={asig.planificacionId}
                      onChange={(e) => handleAsignacionChange(index, "planificacionId", e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {planificaciones.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Fecha inicio</Label>
                    <Input
                      type="date"
                      value={asig.fechaInicio}
                      onChange={(e) => handleAsignacionChange(index, "fechaInicio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      type="date"
                      value={asig.fechaFin}
                      onChange={(e) => handleAsignacionChange(index, "fechaFin", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={addAsignacion} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar asignación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 6: Resumen */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Revisa y descarga la configuración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Empresa</h3>
              <p className="text-sm text-gray-600">
                {empresa.razonSocial} - {empresa.rut}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Administradores</h3>
              {administradores.map((admin, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {admin.nombre} - {admin.email}
                </p>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Trabajadores</h3>
              <p className="text-sm text-gray-600">{trabajadores.length} trabajadores cargados</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Turnos</h3>
              <p className="text-sm text-gray-600">{turnos.length} turnos definidos</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Planificaciones</h3>
              <p className="text-sm text-gray-600">{planificaciones.length} planificaciones creadas</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Asignaciones</h3>
              <p className="text-sm text-gray-600">{asignaciones.length} asignaciones configuradas</p>
            </div>

            <Button onClick={exportToExcel} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex justify-between mt-6">
        <Button onClick={handleBack} disabled={step === 0} variant="outline">
          ← Atrás
        </Button>
        <span className="text-sm text-gray-600">
          Paso {step + 1} de {steps.length}
        </span>
        <Button onClick={handleNext} disabled={step === steps.length - 1}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
