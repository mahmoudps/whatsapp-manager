import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>WhatsApp Manager</CardTitle>
          <CardDescription>Welcome to your WhatsApp management dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Get started by exploring the available features.</p>
        </CardContent>
        <CardFooter>
          <Button>Explore</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
