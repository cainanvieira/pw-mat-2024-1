import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputMask from 'react-input-mask'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'
import { ptBR } from 'date-fns/locale/pt-BR'
import { parseISO } from 'date-fns'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import useConfirmDialog from '../../ui/useConfirmDialog'
import useNotification from '../../ui/useNotification'
import useWaiting from '../../ui/useWaiting'
import { useNavigate, useParams } from 'react-router-dom'
import myfetch from '../../lib/myfetch'
import Car from '../../models/car'
import { ZodError } from 'zod'
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function CarForm() {

  const formDefaults = {
    brand: '',
    model: '',
    color: '',
    year_manufacture: null,
    imported: '',
    plates: '',
    selling_price: ''
  }

  const [state, setState] = React.useState({
    car: { ...formDefaults },
    formModified: false,
    inputErrors: {}
  })
  const {
    car: car,
    formModified,
    inputErrors
  } = state

  const colors = [
    { value: 'Amarelo', label: 'Amarelo' },
    { value: 'Azul', label: 'Azul' },
    { value: 'Bordo', label: 'Bordô' },
    { value: 'Branco', label: 'Branco' },
    { value: 'Carmim', label: 'Carmim' },
    { value: 'Ciano', label: 'Ciano' },
    { value: 'Prata', label: 'Prata' },
    { value: 'Preto', label: 'Preto' },
  ]

  const { askForConfirmation, ConfirmDialog } = useConfirmDialog()
  const { notify, Notification } = useNotification()
  const { showWaiting, Waiting } = useWaiting()
  const navigate = useNavigate()

  const platesMaskFormatChars = {
    '9': '[0-9]',
    'A': '[A-Z]',
    '$': '[0-9,A-J]'
  }

  const params = useParams()

  function handleFieldChange(e) {
    // Tira uma cópia do objeto que representa o carro
    const carCopy = { ...car }
    // Atualiza o campo modificado em carCopy
    carCopy[e.target.name] = e.target.value
    // Atualiza a variável de color, substituindo o objeto car
    // pela cópia atualizada
    setState({ ...state, car: carCopy, formModified: true })

  }

  async function handleFormSubmit(e) {
    e.preventDefault()    // Evita o recarregamento da página
    // Exibir a tela de espera
    showWaiting(true)
    try {
      // Invoca a validação dos dados de entrada da biblioteca Zod
      // por meio do model Car
      Car.parse(car)

      // Envia os dados para o back-end para criar um novo carro
      // no banco de dados
      // Se houver parâmetro na rota, significa que estamos editando.
      // Portanto, precisamos enviar os dados ao back-end com o verbo PUT
      if (params.id) await myfetch.put(`/cars/${params.id}`, car)

      // Senão, os dados serão enviados com o método POST para a criação de
      // um novo cliente
      else await myfetch.post('/cars', car)

      // Deu certo, vamos exibir a mensagem de feedback que, quando fechada,
      // vai nos mandar de volta para a listagem de clientes
      notify('Item salvo com sucesso.', 'success', 4000, () => {
        navigate('..', { relative: 'path', replace: true })
      })
    }
    catch (error) {
      console.error(error)
      if (error instanceof ZodError) {
        // Formamos um objeto contendo os erros do Zod e
        // os colocamos na variável de estado inputErrors
        const errorMessages = {}
        for (let e of error.issues) errorMessages[e.path[0]] = e.message
        setState({ ...state, inputErrors: errorMessages })
        notify('Há campos com valores inválidos no formulário', 'error')
      }
      else {
        console.error(error)
        // Deu errado, exibimos o erro e permanecemos na página do formulário
        notify(error.message, 'error')
      }
    }
    finally {
      showWaiting(false)
    }
  }

  // useEffect() que é executado uma vez no carregamento da página.
  // Verifica se a rota tem parâmetros e, caso tenha, significa que estamos
  // vindo do botão de edição. Nesse caso, chama a função loadData() para
  // buscar os dados do carro a ser editado no back-end
  React.useEffect(() => {
    if (params.id) loadData()
  }, [])

  async function loadData() {
    showWaiting(true)
    try {
      const result = await myfetch.get(`/cars/${params.id}`)

      // Converte o formato de data armazenado no banco de dados
      // para o formato reconhecido pelo componente DatePicker
      result.year_manufacture = parseISO(result.year_manufacture)

      setState({ ...state, car: result })
    }
    catch (error) {
      console.error(error)
      notify(error.message, 'error')
    }
    finally {
      showWaiting(false)
    }
  }

  async function handleBackButtonClick() {
    if (formModified &&
      ! await askForConfirmation('Há informações não salvas. Deseja realmente sair?')) {
      return  // Sai sem fazer nada
    }
    // Navega para a página anterior
    navigate('..', { relative: 'path', replace: true })
  }

  return (
    <>

      <ConfirmDialog />
      <Notification />
      <Waiting />

      <Typography variant="h1" gutterBottom>
        {params.id ? `Editar veículo ${params.id}` : 'Cadastrar novo veículo'}
      </Typography>

      <Box className="form-fields">
        <form onSubmit={handleFormSubmit}>

          <TextField
            name="brand"
            label="Marca do veículo"
            variant="filled"
            required
            fullWidth
            autoFocus
            value={car.brand}
            onChange={handleFieldChange}
            error={inputErrors?.brand}
            helperText={inputErrors?.brand}
          />

          <TextField
            name="model"
            label="Modelo do veículo"
            variant="filled"
            required
            fullWidth
            value={car.model}
            onChange={handleFieldChange}
            error={inputErrors?.model}
            helperText={inputErrors?.model}
          />

          <TextField
            name="color"
            label="Cor"
            variant="filled"
            required
            fullWidth
            value={car.color}
            onChange={handleFieldChange}
            select
            error={inputErrors?.color}
            helperText={inputErrors?.color}
          >
            {
              colors.map(s =>
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              )
            }
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Data de fabricação"
              value={car.year_manufacture}
              views={['year']}
              onChange={value => handleFieldChange({
                target: { name: 'year_manufacture', value: value.getFullYear() }
              }
              )}
              slotProps={{
                textField: {
                  variant: 'filled',
                  fullWidth: true,
                  error: inputErrors?.year_manufacture,
                  helperText: inputErrors?.year_manufacture
                }
              }}
              minDate={new Date(1951, 0, 1)}
              maxDate={new Date(2024, 0, 1)}
            />
          </LocalizationProvider>

          <InputMask
            mask="AAA-9$99"
            formatChars={platesMaskFormatChars}
            maskChar=" "
            value={car.plates}
            onChange={handleFieldChange}
          >
            {
              () =>
                <TextField
                  name="plates"
                  label="Placa"
                  variant="filled"
                  required
                  fullWidth
                  error={inputErrors?.plates}
                  helperText={inputErrors?.plates}
                />
            }
          </InputMask>

          <TextField
            name="selling_price"
            label="Valor de Venda"
            variant="filled"
            required
            fullWidth
            value={car.selling_price}
            type="Number"
            onChange={handleFieldChange}
            error={inputErrors?.selling_price}
            helperText={inputErrors?.selling_price}
          />

          <FormControlLabel
            sx={{ display: 'inline', width: '50%', justifyContent: 'space-around' }}
            control={
              <Checkbox
                name="imported"
                checked={car.imported}
                onChange={(event) => handleFieldChange({
                  target: {
                    name: 'imported',
                    value: event.target.checked
                  },
                })}
                color="primary"
              />
            }
            label="Importado?"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            <Button
              variant="contained"
              color="secondary"
              type="submit"
            >
              Salvar
            </Button>

            <Button
              variant="outlined"
              onClick={handleBackButtonClick}
            >
              Voltar
            </Button>
          </Box>

          { /*<Box sx={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', width: '100%' }}>
            {JSON.stringify(car)}
            <hr />
            {JSON.stringify(inputErrors)}
            </Box> */}

        </form>
      </Box>
    </>
  )
}